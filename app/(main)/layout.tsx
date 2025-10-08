import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ResponsiveSidebar } from "@/components/layout/responsive-sidebar";
import { CommandMenu } from "@/components/command-menu";
import { TranslationProvider } from "@/contexts/translation-context";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <TranslationProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <ResponsiveSidebar userRole={session.user.role} />
          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        <CommandMenu />
      </div>
    </TranslationProvider>
  );
}
