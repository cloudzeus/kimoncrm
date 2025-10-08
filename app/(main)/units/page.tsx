import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitsTable } from "@/components/units/units-table";
import { RefreshCw } from "lucide-react";

export const metadata = {
  title: "Units",
};

export default async function UnitsPage() {
  const units = await prisma.unit.findMany({
    include: { translations: true },
    orderBy: { name: "asc" },
  });


  async function sync() {
    "use server";
    const base = process.env.NEXT_PUBLIC_BASE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const c = await cookies();
    await fetch(`${base}/api/master-data/units/sync`, {
      method: 'POST',
      cache: 'no-store',
      headers: { cookie: c.toString() },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Units</h2>
        <form action={sync}>
          <Button type="submit">
            <RefreshCw className="h-4 w-4 mr-2" /> Sync from ERP
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Units</CardTitle>
        </CardHeader>
        <CardContent>
          <UnitsTable />
        </CardContent>
      </Card>
    </div>
  );
}


