import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import CompanyDetailsForm from "@/components/settings/company-details-form";

export default async function CompanyDetailsPage() {
  const session = await auth();
  if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${baseUrl}/api/settings/default-company`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });
  const json = res.ok ? await res.json() : { data: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">COMPANY DETAILS</h1>
        <p className="text-muted-foreground">Defaults used in emails and reports</p>
      </div>

      <CompanyDetailsForm initialData={json.data ?? null} />
    </div>
  );
}
