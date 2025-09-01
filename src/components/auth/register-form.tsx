

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, limit } from "firebase/firestore";


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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { userProfiles } from "@/lib/permissions";
import { auth, db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  profileType: z.string({ required_error: "Por favor, selecione um tipo de perfil." }),
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  document: z.string().min(11, { message: "Por favor, insira um CPF ou CNPJ válido." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  whatsapp: z.string().min(10, { message: "Por favor, insira um número de WhatsApp válido." }),
  creci: z.string().optional(),
  address: z.string().min(5, { message: "Por favor, insira um endereço válido." }),
  password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
}).refine(data => {
    // Torna CRECI obrigatório para corretores e imobiliárias
    if (data.profileType === 'Corretor Autônomo' || data.profileType === 'Imobiliária') {
        return data.creci && data.creci.length > 0;
    }
    return true;
}, {
    message: "O CRECI é obrigatório para este tipo de perfil.",
    path: ["creci"], // Aponta o erro para o campo CRECI
});


const registrationProfiles = userProfiles.filter(p => ['Imobiliária', 'Corretor Autônomo', 'Investidor', 'Construtora'].includes(p));

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileType: "",
      name: "",
      document: "",
      email: "",
      whatsapp: "",
      creci: "",
      address: "",
      password: "",
    },
  });
  
  const watchedProfileType = form.watch("profileType");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, limit(1));
        const usersSnapshot = await getDocs(q);
        const isFirstUser = usersSnapshot.empty;

        const role = isFirstUser ? 'Super Usuário' : values.profileType;

        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        // Se for uma nova imobiliária, o ID da imobiliária é o próprio UID do usuário admin.
        // Se for o Super Usuário, o imobiliariaId é nulo (ele não pertence a uma).
        // Para outros, eles não pertencem a uma imobiliária neste momento.
        const imobiliariaId = role === 'Imobiliária' ? user.uid : null;

        await updateProfile(user, { displayName: values.name });
        
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: values.name,
            email: values.email,
            role: role,
            imobiliariaId: imobiliariaId,
            document: values.document,
            whatsapp: values.whatsapp,
            creci: values.creci || null,
            address: values.address,
            createdAt: new Date().toISOString(),
        });
        
        toast({
            title: "Conta Criada com Sucesso!",
            description: "Você será redirecionado para fazer o login.",
        });
        router.push("/");

    } catch (error: any) {
        console.error("Registration Error: ", error);
        let description = "Não foi possível criar sua conta. Tente novamente.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Este endereço de e-mail já está em uso.";
        }
        toast({
            variant: "destructive",
            title: "Erro no Cadastro",
            description,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="profileType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eu sou...</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu tipo de perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {registrationProfiles.map(profile => (
                        <SelectItem key={profile} value={profile}>{profile}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo / Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF / CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="nome@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 90000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creci"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn((watchedProfileType === 'Corretor Autônomo' || watchedProfileType === 'Imobiliária') && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
                        CRECI
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="12345-F" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua Principal, 123, Cidade" {...field} />
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
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                          onClick={() => setShowPassword(prev => !prev)}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                          <span className="sr-only">{showPassword ? "Ocultar senha" : "Mostrar senha"}</span>
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando Conta..." : "Criar Conta"}
            </Button>
        </form>
      </Form>
  );
}
