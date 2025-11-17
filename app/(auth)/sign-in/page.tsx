import { SignInForm } from "@/components/auth/sign-in-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error;

  let errorMessage: string | null = null;
  
  if (error === "OAuthAccountNotLinked") {
    errorMessage = "Your account has been automatically linked. Please try signing in again.";
  } else if (error === "OAuthSignin") {
    errorMessage = "Error occurred with OAuth sign in. Please try again.";
  } else if (error === "OAuthCallback") {
    errorMessage = "Error occurred in OAuth callback. Please try again.";
  } else if (error === "OAuthCreateAccount") {
    errorMessage = "Could not create OAuth account. Please contact support.";
  } else if (error === "EmailCreateAccount") {
    errorMessage = "Could not create account. Please try again.";
  } else if (error === "Callback") {
    errorMessage = "Error occurred in callback. Please try again.";
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">SIGN IN</h1>
        <p className="text-muted-foreground mt-2">
          Enter your credentials to access your account
        </p>
      </div>
      
      {/* Show error message if account linking issue */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sign In Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <SignInForm />
    </div>
  );
}
