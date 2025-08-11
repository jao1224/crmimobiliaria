import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/icons/logo";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="flex w-full max-w-md flex-col items-center space-y-6">
        <Logo className="h-12 w-12 text-primary" />
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back to LeadFlow
          </h1>
          <p className="text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
