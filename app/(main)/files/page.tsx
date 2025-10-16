import { FilesManager } from "@/components/files/files-manager";

export const metadata = {
  title: "FILES | AIC CRM",
  description: "Manage all files and documents",
};

export default function FilesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold uppercase">FILES</h1>
        <p className="text-muted-foreground">
          Manage all files and documents across customers, suppliers, users, projects, tasks, and site surveys
        </p>
      </div>
      <FilesManager />
    </div>
  );
}


