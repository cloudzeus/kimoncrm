import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">SIGN IN</h1>
        <p className="text-muted-foreground mt-2">
          Enter your credentials to access your account
        </p>
      </div>
      <SignInForm />
    </div>
  );
}
