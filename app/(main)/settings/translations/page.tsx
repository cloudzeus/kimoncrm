import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TranslationManager } from "@/components/translations/translation-manager";

export default async function TranslationsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">TRANSLATION MANAGEMENT</h1>
        <p className="text-muted-foreground">
          Manage UI translations and use AI to translate content
        </p>
      </div>
      
      <TranslationManager />
    </div>
  );
}
