
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um endereço de e-mail válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [isResetDialogOpen, setResetDialogOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const watchedEmail = form.watch("email");
  
  React.useEffect(() => {
    if (watchedEmail) {
      setResetEmail(watchedEmail);
    }
  }, [watchedEmail]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Login bem-sucedido",
        description: "Redirecionando para o seu painel...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: "Credenciais inválidas. Verifique seu e-mail e senha.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "E-mail Necessário",
        description: "Por favor, insira um endereço de e-mail.",
      });
      return;
    }
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "E-mail Enviado!",
        description: "Verifique sua caixa de entrada para o link de redefinição de senha.",
      });
      setResetDialogOpen(false);
    } catch (error: any) {
      console.error("Password Reset Error:", error);
       let description = "Ocorreu um erro ao enviar o e-mail.";
       if (error.code === 'auth/user-not-found') {
           description = "Nenhum usuário encontrado com este endereço de e-mail.";
       }
      toast({
        variant: "destructive",
        title: "Erro ao Redefinir Senha",
        description: description,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input placeholder="nome@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Senha</FormLabel>
                  <DialogTrigger asChild>
                    <button type="button" className="ml-auto inline-block text-sm underline">
                        Esqueceu a senha?
                    </button>
                  </DialogTrigger>
                </div>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Form>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
                Insira o endereço de e-mail associado à sua conta e enviaremos um link para redefinir sua senha.
            </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reset-email" className="text-right">
                    E-mail
                </Label>
                <Input
                    id="reset-email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="col-span-3"
                    placeholder="nome@example.com"
                />
            </div>
        </div>
        <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handlePasswordReset} disabled={isResetting}>
                {isResetting ? "Enviando..." : "Enviar Link de Redefinição"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </>
  );
}
