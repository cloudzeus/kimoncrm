import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileManager } from "@/components/profile/profile-manager";

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Management</h1>
          <p className="text-muted-foreground">
            Manage your personal information, password, and avatar
          </p>
        </div>
        
        <ProfileManager user={session.user} />
      </div>
    </div>
  );
}
