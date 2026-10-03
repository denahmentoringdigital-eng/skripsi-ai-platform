// Daftar admin diatur lewat environment variable ADMIN_EMAILS (pisahkan dengan koma),
// mis. ADMIN_EMAILS=admin@domain.com,staf@domain.com. Tidak perlu ubah database.
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
