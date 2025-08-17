
import { RegisterForm } from "@/components/auth/register-form";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center">
            <Image src="/logo.png" alt="Ideal Imóveis Logo" width={80} height={80} />
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Crie sua conta Ideal Imóveis
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
            Junte-se à plataforma para otimizar seu negócio imobiliário.
            </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
