
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Client } from "@/lib/mock-data";
import { useEffect, useState } from "react";

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Omit<Client, "id" | "active">) => Promise<void>;
    initialData?: Client;
}

export function ClientDialog({ open, onOpenChange, onSubmit, initialData }: ClientDialogProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [cpfCnpj, setCpfCnpj] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            if (initialData) {
                setName(initialData.name);
                setPhone(initialData.phone || "");
                setEmail(initialData.email || "");
                setCpfCnpj(initialData.cpf_cnpj || "");
                setNotes(initialData.notes || "");
            } else {
                setName("");
                setPhone("");
                setEmail("");
                setCpfCnpj("");
                setNotes("");
            }
        }
    }, [open, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await onSubmit({
                name,
                phone,
                email,
                cpf_cnpj: cpfCnpj,
                notes
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-2 border-white bg-zinc-950 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl uppercase">
                        {initialData ? "Editar Cliente" : "Novo Cliente"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="font-mono text-xs uppercase text-primary">Nome / Razão Social *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-black/50 border-white/20 font-bold uppercase focus:border-primary"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone" className="font-mono text-xs uppercase">Telefone (WhatsApp)</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="bg-black/50 border-white/20 font-mono"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cpf" className="font-mono text-xs uppercase">CPF / CNPJ</Label>
                            <Input
                                id="cpf"
                                value={cpfCnpj}
                                onChange={(e) => setCpfCnpj(e.target.value)}
                                className="bg-black/50 border-white/20 font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email" className="font-mono text-xs uppercase">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-black/50 border-white/20 font-mono lowercase"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes" className="font-mono text-xs uppercase">Observações</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-black/50 border-white/20 min-h-[80px]"
                        />
                    </div>

                    <DialogFooter className="mt-4 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-white/20 uppercase hover:bg-white/10"
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary text-white font-bold uppercase hover:bg-primary/90"
                            disabled={isLoading}
                        >
                            {isLoading ? "Salvando..." : "Salvar Cliente"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
