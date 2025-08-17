
import { RegisterForm } from "@/components/auth/register-form";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  return (
     <main className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[450px] gap-6">
           <div className="grid gap-2 text-center">
             <Image src="/logo.png" alt="Ideal Imóveis Logo" width={60} height={60} className="mx-auto" />
            <h1 className="text-3xl font-bold text-foreground">Crie sua Conta</h1>
            <p className="text-balance text-muted-foreground">
              Junte-se à plataforma para otimizar seu negócio imobiliário.
            </p>
          </div>
          <RegisterForm />
           <div className="mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/" className="underline">
              Entrar
            </Link>
          </div>
        </div>
      </div>
       <div className="hidden bg-muted lg:block">
        <Image
          src="https://placehold.co/1920x1080.png"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          data-ai-hint="modern kitchen interior"
        />
      </div>
    </main>
  );
}
