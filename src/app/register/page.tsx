
import { RegisterForm } from "@/components/auth/register-form";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  return (
     <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="mx-auto grid w-full max-w-md gap-6">
           <div className="grid gap-2 text-center">
             
            <h1 className="text-3xl font-bold text-foreground">Crie sua Conta</h1>
            <p className="text-balance text-muted-foreground">
              Junte-se à plataforma para otimizar seu negócio imobiliário.
            </p>
          </div>
          <RegisterForm />
           <div className="mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/" className="font-semibold text-primary underline-offset-4 hover:underline">
              Entrar
            </Link>
          </div>
        </div>
    </main>
  );
}
