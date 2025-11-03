import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminPage() {
  await requireAdmin();

  // Redirect to the admin overview page
  redirect("/admin/overview");
}
