"use client";

import { useCallback, useEffect, useState } from "react";

type Stats = {
  totalUsers: number;
  newUsers7d: number;
  perPlan: Record<string, number>;
  totalProjects: number;
  chaptersDrafted: number;
  creditsUsed: number;
  revenueTotal: number;
  revenueThisMonth: number;
  successTransactions: number;
  successTransactionsThisMonth: number;
  pendingTransactions: number;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  campus: string | null;
  major: string | null;
  plan: string;
  effectivePlan: string;
  planExpiresAt: string | null;
  aiCreditsUsed: number;
  projectCount: number;
  createdAt: string;
  isAdmin: boolean;
};

type Tx = {
  id: string;
  plan: string;
  amount: number;
  status: string;
  createdAt: string;
  userName: string;
  userEmail: string;
};

const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");
const dateStr = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";

type Tab = "stats" | "users" | "tx";

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("stats");
  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {([
          ["stats", "Ringkasan"],
          ["users", "User"],
          ["tx", "Transaksi"],
        ] as [Tab, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === k
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "stats" && <StatsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "tx" && <TxTab />}
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function StatsTab() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setS)
      .catch(() => setErr("Gagal memuat statistik."));
  }, []);
  if (err) return <p className="text-red-600">{err}</p>;
  if (!s) return <p className="text-slate-500">Memuat...</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Total user" value={s.totalUsers} sub={`+${s.newUsers7d} dalam 7 hari`} />
      <Card
        label="Paket"
        value={`${s.perPlan.FREE ?? 0} / ${s.perPlan.PRO ?? 0} / ${s.perPlan.CAMPUS ?? 0}`}
        sub="Free / Pro / Kampus"
      />
      <Card label="Proyek skripsi" value={s.totalProjects} sub={`${s.chaptersDrafted} bab didrafkan`} />
      <Card label="Kredit AI terpakai" value={s.creditsUsed} />
      <Card label="Pendapatan total" value={rupiah(s.revenueTotal)} sub={`${s.successTransactions} transaksi sukses`} />
      <Card
        label="Pendapatan bulan ini"
        value={rupiah(s.revenueThisMonth)}
        sub={`${s.successTransactionsThisMonth} transaksi`}
      />
      <Card label="Transaksi pending" value={s.pendingTransactions} />
    </div>
  );
}

function Pager({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>
        {total} data · halaman {page}/{pages}
      </span>
      <div className="flex gap-2">
        <button className="btn-secondary !px-3 !py-1" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Sebelumnya
        </button>
        <button className="btn-secondary !px-3 !py-1" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Berikutnya
        </button>
      </div>
    </div>
  );
}

function UsersTab() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ users: AdminUser[]; total: number; pageSize: number } | null>(null);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const load = useCallback(() => {
    setErr("");
    fetch(`/api/admin/users?q=${encodeURIComponent(query)}&page=${page}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setErr("Gagal memuat user."));
  }, [query, page]);

  useEffect(load, [load]);

  return (
    <div>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(q);
        }}
      >
        <input
          className="input max-w-sm"
          placeholder="Cari nama, email, atau kampus"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-primary !px-4 !py-2" type="submit">
          Cari
        </button>
      </form>
      {err && <p className="text-red-600">{err}</p>}
      {!data ? (
        <p className="text-slate-500">Memuat...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Paket</th>
                  <th className="px-4 py-3">Berakhir</th>
                  <th className="px-4 py-3">Kredit</th>
                  <th className="px-4 py-3">Proyek</th>
                  <th className="px-4 py-3">Daftar</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {u.name} {u.isAdmin && <span className="ml-1 rounded bg-brand-50 px-1.5 text-xs text-brand-600">admin</span>}
                      </div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">{u.effectivePlan}</td>
                    <td className="px-4 py-3">{dateStr(u.planExpiresAt)}</td>
                    <td className="px-4 py-3">{u.aiCreditsUsed}</td>
                    <td className="px-4 py-3">{u.projectCount}</td>
                    <td className="px-4 py-3">{dateStr(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-brand-600 hover:underline" onClick={() => setSelected(u)}>
                        Kelola
                      </button>
                    </td>
                  </tr>
                ))}
                {data.users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      Tidak ada user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
        </>
      )}
      {selected && (
        <UserModal
          user={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onChanged,
}: {
  user: AdminUser;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [tempPw, setTempPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [plan, setPlan] = useState(user.plan);
  const [expires, setExpires] = useState(user.planExpiresAt ? user.planExpiresAt.slice(0, 10) : "");
  const [resetCredits, setResetCredits] = useState(false);
  const [credits, setCredits] = useState(String(user.aiCreditsUsed));

  async function call(method: "PATCH" | "DELETE", body?: unknown) {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || "Terjadi kesalahan.");
        return null;
      }
      return json;
    } catch {
      setErr("Koneksi gagal.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function doReset() {
    const json = await call("PATCH", { action: "resetPassword", ...(newPw ? { newPassword: newPw } : {}) });
    if (json?.temporaryPassword) {
      setTempPw(json.temporaryPassword);
      setNewPw("");
    }
  }

  async function doPlan() {
    const json = await call("PATCH", {
      action: "setPlan",
      plan,
      planExpiresAt: plan === "FREE" || !expires ? null : new Date(expires + "T23:59:59").toISOString(),
      resetCredits,
    });
    if (json) setMsg("Paket diperbarui.");
  }

  async function doCredits() {
    const n = parseInt(credits, 10);
    if (Number.isNaN(n) || n < 0) return setErr("Jumlah kredit tidak valid.");
    const json = await call("PATCH", { action: "setCredits", aiCreditsUsed: n });
    if (json) setMsg("Kredit diperbarui.");
  }

  async function doDelete() {
    if (!confirm(`Hapus akun ${user.email} beserta semua proyeknya? Tindakan ini tidak bisa dibatalkan.`)) return;
    const json = await call("DELETE");
    if (json) onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <button onClick={onChanged} className="text-slate-400 hover:text-slate-700" aria-label="Tutup">
            ✕
          </button>
        </div>

        {err && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}
        {msg && <p className="mb-3 rounded bg-green-50 p-2 text-sm text-green-700">{msg}</p>}

        <section className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Reset password</h3>
          <input
            className="input"
            placeholder="Password baru (kosongkan untuk dibuatkan otomatis)"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <button className="btn-primary mt-2 !px-4 !py-2" disabled={busy} onClick={doReset}>
            Reset password
          </button>
          {tempPw && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              Password baru (hanya tampil sekali, berikan ke user):
              <div className="mt-1 select-all font-mono text-base font-bold">{tempPw}</div>
            </div>
          )}
        </section>

        <section className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Paket</h3>
          <div className="flex gap-2">
            <select className="input" value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="FREE">FREE</option>
              <option value="PRO">PRO</option>
              <option value="CAMPUS">CAMPUS</option>
            </select>
            <input
              type="date"
              className="input"
              disabled={plan === "FREE"}
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={resetCredits} onChange={(e) => setResetCredits(e.target.checked)} />
            Reset pemakaian kredit AI ke 0
          </label>
          <button className="btn-primary mt-2 !px-4 !py-2" disabled={busy} onClick={doPlan}>
            Simpan paket
          </button>
        </section>

        <section className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Kredit AI terpakai</h3>
          <div className="flex gap-2">
            <input className="input" type="number" min={0} value={credits} onChange={(e) => setCredits(e.target.value)} />
            <button className="btn-secondary !px-4 !py-2" disabled={busy} onClick={doCredits}>
              Simpan
            </button>
          </div>
        </section>

        {!user.isAdmin && (
          <section className="border-t border-slate-100 pt-4">
            <button className="text-sm font-medium text-red-600 hover:underline" disabled={busy} onClick={doDelete}>
              Hapus akun ini
            </button>
          </section>
        )}
        <div className="mt-4 text-right">
          <button className="btn-secondary !px-4 !py-2" onClick={onChanged}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function TxTab() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ transactions: Tx[]; total: number; pageSize: number } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setErr("");
    fetch(`/api/admin/transactions?status=${status}&page=${page}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setErr("Gagal memuat transaksi."));
  }, [status, page]);

  return (
    <div>
      <select
        className="input mb-4 max-w-xs"
        value={status}
        onChange={(e) => {
          setPage(1);
          setStatus(e.target.value);
        }}
      >
        <option value="">Semua status</option>
        <option value="SUCCESS">SUCCESS</option>
        <option value="PENDING">PENDING</option>
      </select>
      {err && <p className="text-red-600">{err}</p>}
      {!data ? (
        <p className="text-slate-500">Memuat...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Paket</th>
                  <th className="px-4 py-3">Jumlah</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{dateStr(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{t.userName}</div>
                      <div className="text-xs text-slate-500">{t.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">{t.plan}</td>
                    <td className="px-4 py-3">{rupiah(t.amount)}</td>
                    <td className="px-4 py-3">{t.status}</td>
                  </tr>
                ))}
                {data.transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      Belum ada transaksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
        </>
      )}
    </div>
  );
}
