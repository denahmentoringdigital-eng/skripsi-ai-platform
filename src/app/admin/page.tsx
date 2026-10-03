import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminPanel from "@/components/AdminPanel";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="mb-6 text-sm text-slate-500">Masuk sebagai {admin.email}</p>
        <AdminPanel />
      </main>
      <Footer />
    </>
  );
}
