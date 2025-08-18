
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Dialog>
        <div className="w-full max-w-sm">
          <div className="mx-auto grid gap-6">
            <div className="grid gap-4 text-center">
              
              <h1 className="text-3xl font-bold text-foreground">Ideal Imóveis</h1>
              <p className="text-balance text-muted-foreground">
                Bem-vindo(a) de volta! Insira suas credenciais.
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <LoginForm />
              </CardContent>
            </Card>
            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{" "}
              <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                Cadastre-se
              </Link>
            </div>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
