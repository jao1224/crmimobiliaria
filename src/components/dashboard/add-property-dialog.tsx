
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { propertyTypes, type PropertyType, addProperty, updateProperty, uploadImage, getUsers, type User } from "@/lib/data";
import { Upload } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

interface AddPropertyDialogProps {
  children: React.ReactNode;
  onPropertyAdded?: () => void;
}

export function AddPropertyDialog({ children, onPropertyAdded }: AddPropertyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast({ variant: 'destructive', title: "Arquivo muito grande", description: "Por favor, selecione uma imagem com menos de 2MB." });
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({ variant: 'destructive', title: "Formato inválido", description: "Por favor, selecione uma imagem (JPG, PNG, GIF, WebP)." });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProperty = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para adicionar um imóvel.' });
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      const timestamp = Date.now();
      const displayCode = `ID-${String(timestamp).slice(-6)}`;

      const newPropertyData: Omit<any, 'id'> = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        status: 'Disponível',
        price: Number(formData.get('price')),
        commission: Number(formData.get('commission')),
        type: formData.get('type') as PropertyType,
        description: formData.get('description') as string,
        ownerInfo: formData.get('owner') as string,
        imageUrl: 'https://placehold.co/600x400.png',
        displayCode,
        imageHint: 'novo imovel',
        capturedById: currentUser.uid,
        capturedBy: currentUser.displayName || 'N/A',
      };

      const propertyId = await addProperty(newPropertyData);

      if (selectedFile) {
        try {
          const imageUrl = await uploadImage(selectedFile, propertyId);
          await updateProperty(propertyId, { imageUrl });
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            variant: "warning",
            title: "Imóvel salvo, mas imagem falhou",
            description: "O imóvel foi cadastrado, mas houve um problema com a imagem."
          });
        }
      }

      toast({ title: 'Sucesso!', description: 'Imóvel adicionado com sucesso.' });
      setIsOpen(false);
      onPropertyAdded?.(); // Chama o callback de sucesso
    } catch (error: any) {
      console.error('Error adding property:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: error.message || 'Não foi possível adicionar o imóvel.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setSelectedFile(null);
      formRef.current?.reset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <form onSubmit={handleAddProperty} ref={formRef}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Imóvel</DialogTitle>
            <DialogDescription>Preencha os detalhes abaixo para cadastrar um novo imóvel.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Imóvel</Label>
                <Input id="name" name="name" placeholder="Ex: Apartamento Vista Mar" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" placeholder="Rua, Número, Bairro, Cidade" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input id="price" name="price" type="number" placeholder="750000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Comissão (%)</Label>
                  <Input id="commission" name="commission" type="number" step="0.1" placeholder="5" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Imóvel</Label>
                <Select name="type" required>
                  <SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-add">Imagem do Imóvel</Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Preview do imóvel" width={80} height={80} className="rounded-md object-cover aspect-square" />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                      <Upload className="h-6 w-6" />
                    </div>
                  )}
                  <Input id="image-add" name="image" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" placeholder="Detalhes do imóvel..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Informações do Proprietário</Label>
                <Textarea id="owner" name="owner" placeholder="Nome, contato..." rows={2} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Imóvel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
