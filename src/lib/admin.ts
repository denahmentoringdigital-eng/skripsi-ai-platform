import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-email";

export { getAdminEmails, isAdminEmail } from "@/lib/admin-email";

// Dipakai di setiap API/halaman admin. Selalu cek ulang ke ADMIN_EMAILS
// (bukan hanya percaya flag di token), jadi mencabut admin cukup hapus emailnya.
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!session?.user?.id || !isAdminEmail(email)) return null;
  return { id: session.user.id, email: email as string };
}
