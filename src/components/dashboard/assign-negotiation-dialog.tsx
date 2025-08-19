
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Negotiation, User } from "@/lib/data";

interface AssignNegotiationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    negotiation: Negotiation | null;
    realtors: User[];
    onAssign: (negotiationId: string, newSalesperson: string) => Promise<void>;
}

export function AssignNegotiationDialog({
    isOpen,
    onOpenChange,
    negotiation,
    realtors,
    onAssign,
}: AssignNegotiationDialogProps) {
    const [selectedRealtor, setSelectedRealtor] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Preenche o valor inicial quando o diálogo é aberto com uma negociação
        if (negotiation) {
            setSelectedRealtor(negotiation.salesperson);
        }
    }, [negotiation]);

    const handleSubmit = async () => {
        if (!negotiation || !selectedRealtor) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Selecione um novo responsável.",
            });
            return;
        }

        setIsSaving(true);
        await onAssign(negotiation.id, selectedRealtor);
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Atribuir Negociação</DialogTitle>
                    <DialogDescription>
                        Envie esta negociação para outro corretor. O novo responsável terá acesso a ela em sua lista.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Negociação</Label>
                        <p className="font-semibold text-sm">{negotiation?.property}</p>
                        <p className="text-xs text-muted-foreground">ID: {negotiation?.id.toUpperCase()}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="realtor-select">Novo Vendedor Responsável</Label>
                        <Select value={selectedRealtor} onValueChange={setSelectedRealtor}>
                            <SelectTrigger id="realtor-select">
                                <SelectValue placeholder="Selecione um corretor" />
                            </SelectTrigger>
                            <SelectContent>
                                {realtors.map((realtor) => (
                                    <SelectItem key={realtor.id} value={realtor.name}>
                                        {realtor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isSaving || !selectedRealtor}>
                        {isSaving ? "Salvando..." : "Salvar Atribuição"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

