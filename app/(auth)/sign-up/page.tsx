import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">SIGN UP</h1>
        <p className="text-muted-foreground mt-2">
          Create your account to get started
        </p>
      </div>
      <SignUpForm />
    </div>
  );
}
