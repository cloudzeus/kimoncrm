import { getMtrGroup } from "@/lib/softone/client";
import { MtrGroupsManager } from "@/components/mtrgroups/mtrgroups-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function MtrGroupsPage() {
  // Fetch products and services mtrgroups server-side
  const productsGroupsPromise = getMtrGroup(51);
  const servicesGroupsPromise = getMtrGroup(52);

  const [productsGroupsData, servicesGroupsData] = await Promise.all([
    productsGroupsPromise.catch((error) => {
      console.error("Error fetching products mtrgroups:", error);
      return { success: false, result: [] };
    }),
    servicesGroupsPromise.catch((error) => {
      console.error("Error fetching services mtrgroups:", error);
      return { success: false, result: [] };
    }),
  ]);

  // Transform data for products
  const productsGroups = (productsGroupsData.result || []).map((group: any) => ({
    mtrgroup: group.MTRGROUP,
    code: group.CODE,
    name: group.NAME,
    sodtype: group.SODTYPE,
    isactive: group.ISACTIVE === "1",
  }));

  // Transform data for services
  const servicesGroups = (servicesGroupsData.result || []).map((group: any) => ({
    mtrgroup: group.MTRGROUP,
    code: group.CODE,
    name: group.NAME,
    sodtype: group.SODTYPE,
    isactive: group.ISACTIVE === "1",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MTRGROUPS</h1>
        <p className="text-muted-foreground">
          Manage products and services mtrgroups with ERP integration.
        </p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">PRODUCT MTRGROUPS</TabsTrigger>
          <TabsTrigger value="services">SERVICE MTRGROUPS</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <MtrGroupsManager initialGroups={productsGroups} sodtype={51} />
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <MtrGroupsManager initialGroups={servicesGroups} sodtype={52} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
