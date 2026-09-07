// Integrasi Mayar.id (payment gateway) untuk langganan Pro/Kampus.
// Dokumentasi: https://docs.mayar.id/api-reference-v2/introduction

export type MayarPlan = "PRO" | "CAMPUS";

interface MayarConfig {
  baseUrl: string;
  apiKey: string;
  productId: string;
  tierIds: Record<MayarPlan, string | undefined>;
}

function getMayarConfig(): MayarConfig {
  const env = (process.env.MAYAR_ENV || "sandbox").toLowerCase();
  const baseUrl = env === "production" ? "https://api.mayar.id/hl/v2" : "https://api.mayar.io/hl/v2";
  const apiKey = process.env.MAYAR_API_KEY || "";
  const productId = process.env.MAYAR_PRODUCT_ID || "";

  if (!apiKey || !productId) {
    throw new Error(
      "Konfigurasi Mayar belum lengkap. Pastikan MAYAR_API_KEY dan MAYAR_PRODUCT_ID sudah diisi di environment variable."
    );
  }

  return {
    baseUrl,
    apiKey,
    productId,
    tierIds: {
      PRO: process.env.MAYAR_TIER_PRO_ID,
      CAMPUS: process.env.MAYAR_TIER_CAMPUS_ID,
    },
  };
}

class MayarApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MayarApiError";
    this.status = status;
  }
}

async function mayarFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, apiKey } = getMayarConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Bukan JSON, biarkan json = null, pesan error pakai teks mentah di bawah.
  }

  if (!res.ok) {
    const body = json as { messages?: unknown; message?: unknown } | null;
    const rawMessage = body?.messages ?? body?.message ?? text ?? `Mayar API error (${res.status})`;
    const message = typeof rawMessage === "string" ? rawMessage : JSON.stringify(rawMessage);
    throw new MayarApiError(message, res.status);
  }

  return json as T;
}

interface MayarMemberCustomer {
  id: string;
  customerId?: string;
  memberId?: string;
  status?: string;
  membershipTierId?: string;
  customer?: { id?: string; name?: string; email?: string; mobile?: string };
}

// Cari member Mayar yang sudah pernah terdaftar untuk email + tier tertentu.
// Dipakai saat registrasi gagal karena "Email sudah terdaftar pada tier ini."
async function findExistingMayarMember(email: string, tierId: string): Promise<MayarMemberCustomer | null> {
  const { productId } = getMayarConfig();
  const params = new URLSearchParams({ productId, searchTerm: email, limit: "20" });
  const res = await mayarFetch<{ data: MayarMemberCustomer[] }>(`/memberships/members?${params.toString()}`);
  const list = res?.data || [];
  const match = list.find(
    (m) => m?.customer?.email?.toLowerCase() === email.toLowerCase() && m?.membershipTierId === tierId
  );
  return match || null;
}

async function registerMayarMember(opts: {
  name: string;
  email: string;
  mobile?: string;
  plan: MayarPlan;
}): Promise<{ member: MayarMemberCustomer; tierId: string }> {
  const { productId, tierIds } = getMayarConfig();
  const tierId = tierIds[opts.plan];
  if (!tierId) {
    throw new Error(`Tier Mayar untuk paket ${opts.plan} belum dikonfigurasi (cek MAYAR_TIER_${opts.plan}_ID).`);
  }

  try {
    // Catatan: respons sukses Mayar untuk endpoint ini adalah { data: <member object> },
    // BUKAN { data: { membershipCustomer: <member object> } } seperti dugaan awal.
    const res = await mayarFetch<{ data: MayarMemberCustomer }>(
      `/memberships/members/create`,
      {
        method: "POST",
        body: JSON.stringify({
          productId,
          membershipTierId: tierId,
          membershipMonthlyPeriod: 1,
          customerInfo: {
            name: opts.name,
            email: opts.email,
            mobile: opts.mobile && opts.mobile.trim() ? opts.mobile.trim() : "0800000000",
          },
        }),
      }
    );
    // Mayar tidak selalu mengembalikan memberId langsung di respons create (mis. saat email yang sama sudah pernah jadi member dan pindah tier PRO->CAMPUS) -- kalau begitu, cari ulang lewat findExistingMayarMember supaya invoice/create tetap bisa jalan.
    return { member: (res.data?.memberId ? res.data : ((await findExistingMayarMember(opts.email, tierId)) || res.data)), tierId };
  } catch (err) {
    if (err instanceof MayarApiError && err.status === 400 && /terdaftar/i.test(err.message)) {
      // Sudah pernah daftar di tier ini sebelumnya -> pakai record yang sudah ada,
      // supaya user bisa bayar ulang (perpanjangan / gagal bayar sebelumnya).
      const existing = await findExistingMayarMember(opts.email, tierId);
      if (existing) return { member: existing, tierId };
    }
    throw err;
  }
}

interface MayarInvoiceData {
  membershipBillUrl?: string;
  billUrl?: string;
  link?: string;
  url?: string;
  invoiceUrl?: string;
  transactionId?: string;
  [key: string]: unknown;
}

async function createMayarMemberInvoice(membershipCustomerId: string): Promise<{ payUrl: string; raw: MayarInvoiceData }> {
  const { productId } = getMayarConfig();
  const res = await mayarFetch<{ data: MayarInvoiceData }>(
    `/memberships/members/${membershipCustomerId}/invoice/create`,
    {
      method: "POST",
      body: JSON.stringify({ productId }),
    }
  );
  const data = res.data || {};
  const payUrl = data.membershipBillUrl || data.billUrl || data.link || data.url || data.invoiceUrl;
  if (!payUrl) {
    throw new Error("Mayar tidak mengembalikan link pembayaran. Coba lagi beberapa saat.");
  }
  return { payUrl, raw: data };
}

// Fungsi utama dipanggil dari API route /api/billing/checkout.
export async function createUpgradeCheckout(opts: {
  name: string;
  email: string;
  mobile?: string;
  plan: MayarPlan;
}): Promise<{ payUrl: string; mayarMemberId: string; tierId: string }> {
  const { member, tierId } = await registerMayarMember(opts);
  // Endpoint invoice/create butuh kode member pendek (mis. "PNFDBTHK" / member.memberId),
  // BUKAN member.id (UUID internal) -- kalau dikirim UUID, Mayar balas 404 "tidak ditemukan".
  const memberId = member.memberId;
  if (!memberId) {
    throw new Error("Tidak menemukan kode member (memberId) dari respons Mayar.");
  }
  const { payUrl } = await createMayarMemberInvoice(memberId);
  return { payUrl, mayarMemberId: memberId, tierId };
}

// Dipakai oleh webhook handler untuk memetakan tierId Mayar -> plan internal kita.
export function getMayarPlanFromTierId(tierId?: string | null): MayarPlan | null {
  if (!tierId) return null;
  const { tierIds } = getMayarConfig();
  if (tierId === tierIds.PRO) return "PRO";
  if (tierId === tierIds.CAMPUS) return "CAMPUS";
  return null;
}
