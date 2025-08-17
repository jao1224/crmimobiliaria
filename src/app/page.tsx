
import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <Image src="/logo.png" alt="Ideal Imóveis Logo" width={60} height={60} className="mx-auto" />
            <h1 className="text-3xl font-bold text-foreground">Login</h1>
            <p className="text-balance text-muted-foreground">
              Insira seu e-mail abaixo para acessar sua conta
            </p>
          </div>
          <LoginForm />
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/register" className="underline">
              Cadastre-se
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
          data-ai-hint="modern building architecture"
        />
      </div>
    </main>
  );
}
