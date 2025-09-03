
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addClient, type Client } from "@/lib/crm-data";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";


interface AddClientDialogProps {
  children: React.ReactNode;
  onClientAdded?: () => void;
}

export function AddClientDialog({ children, onClientAdded }: AddClientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);


  const handleAddClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para adicionar um cliente.' });
      return;
    }

    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const newClientData: Omit<Client, 'id'> = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      source: "Cadastro Direto",
      assignedTo: currentUser.displayName || 'N/A',
      document: formData.get("document") as string,
      civilStatus: formData.get("civilStatus") as Client['civilStatus'],
      birthDate: formData.get("birthDate") as string,
      profession: formData.get("profession") as string,
      address: formData.get("address") as string,
      monthlyIncome: parseFloat(formData.get("monthlyIncome") as string),
      bankInfo: formData.get("bankInfo") as string,
    };

    try {
      await addClient(newClientData);
      toast({ title: "Sucesso!", description: "Cliente adicionado com sucesso." });
      setIsOpen(false);
      onClientAdded?.();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o cliente." });
    } finally {
      setIsSaving(false);
    }
  };
  
   useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>Preencha os detalhes abaixo para criar um novo cliente diretamente.</DialogDescription>
        </DialogHeader>
        <form id="addClientForm" onSubmit={handleAddClient} ref={formRef}>
          <div className="space-y-6 py-4">
            <div className="space-y-4 rounded-lg border p-4"><h3 className="text-lg font-medium">Informações Pessoais</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="name-client">Nome Completo</Label><Input id="name-client" name="name" required /></div><div className="space-y-2"><Label htmlFor="document-client">CPF / CNPJ</Label><Input id="document-client" name="document" /></div><div className="space-y-2"><Label htmlFor="birthDate-client">Data de Nascimento</Label><Input id="birthDate-client" name="birthDate" type="date" /></div><div className="space-y-2"><Label htmlFor="profession-client">Profissão</Label><Input id="profession-client" name="profession" /></div><div className="space-y-2"><Label htmlFor="civilStatus-client">Estado Civil</Label><Select name="civilStatus"><SelectTrigger id="civilStatus-client"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem><SelectItem value="Casado(a)">Casado(a)</SelectItem><SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem><SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem><SelectItem value="União Estável">União Estável</SelectItem></SelectContent></Select></div></div></div>
            <div className="space-y-4 rounded-lg border p-4"><h3 className="text-lg font-medium">Contato e Endereço</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="email-client">E-mail</Label><Input id="email-client" name="email" type="email" required /></div><div className="space-y-2"><Label htmlFor="phone-client">Telefone / WhatsApp</Label><Input id="phone-client" name="phone" required /></div></div><div className="space-y-2"><Label htmlFor="address-client">Endereço Completo</Label><Input id="address-client" name="address" placeholder="Rua, número, bairro, cidade, CEP" /></div></div>
            <div className="space-y-4 rounded-lg border p-4"><h3 className="text-lg font-medium">Informações Financeiras</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="monthlyIncome-client">Renda Mensal (R$)</Label><Input id="monthlyIncome-client" name="monthlyIncome" type="number" step="0.01" placeholder="5000.00" /></div><div className="space-y-2"><Label htmlFor="bankInfo-client">Conta Bancária (PIX)</Label><Input id="bankInfo-client" name="bankInfo" placeholder="Chave PIX ou dados da conta" /></div></div></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" form="addClientForm" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar Cliente"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

