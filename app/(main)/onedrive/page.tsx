import { auth } from "@/auth";
import { FileBrowser } from "@/components/onedrive/file-browser";
import { OneDriveAccessCard } from "@/components/onedrive/onedrive-access-card";
import { redirect } from "next/navigation";

export const metadata = {
  title: "OneDrive",
  description: "Access OneDrive files and folders",
};

export default async function OneDrivePage() {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">OneDrive Access</h1>
        <p className="text-muted-foreground mt-2">
          Access tenant and user OneDrive files
        </p>
      </div>

      <div className="mb-6">
        <OneDriveAccessCard type="user" />
      </div>

      <FileBrowser type="user" />
    </div>
  );
}
