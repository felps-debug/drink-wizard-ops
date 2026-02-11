import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { usePackages } from "@/hooks/usePackages";
import { useInventory } from "@/hooks/useInventory";
import { Plus, Trash2, Package as PackageIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useNavigate } from "react-router-dom";

export default function Pacotes() {
    const navigate = useNavigate();
    const { packages, isLoading, createPackage } = usePackages();
    const { insumos } = useInventory();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [items, setItems] = useState<{ ingredient_id: string; quantity: number }[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleAddItem = (ingredientId: string) => {
        if (items.some(i => i.ingredient_id === ingredientId)) return;
        setItems([...items, { ingredient_id: ingredientId, quantity: 1 }]);
    };

    const handleRemoveItem = (ingredientId: string) => {
        setItems(items.filter(i => i.ingredient_id !== ingredientId));
    };

    const handleUpdateQuantity = (ingredientId: string, qty: number) => {
        setItems(items.map(i => i.ingredient_id === ingredientId ? { ...i, quantity: qty } : i));
    };

    const handleSubmit = async () => {
        await createPackage.mutateAsync({ name, description, items });
        setIsDialogOpen(false);
        setName("");
        setDescription("");
        setItems([]);
    };

    return (
        <AppLayout title="Pacotes">
            <div className="mx-auto max-w-4xl space-y-6 p-4">
                <div className="flex items-center justify-between border-b-4 border-foreground pb-4">
                    <div>
                        <h1 className="font-display text-4xl font-black uppercase tracking-tighter">Pacotes</h1>
                        <p className="font-mono text-xs uppercase text-muted-foreground">Planos e Itens Padrão</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-none border-2 border-primary bg-primary font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                                <Plus className="mr-2 h-4 w-4" /> Novo Pacote
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl rounded-none border-2 border-white bg-zinc-950">
                            <DialogHeader>
                                <DialogTitle className="font-display text-2xl uppercase font-black">Configurar Missão</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label className="font-mono text-xs uppercase">Nome do Pacote</Label>
                                    <Input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="EX: PACOTE PREMIUM 2026"
                                        className="rounded-none border-2 border-white/20 bg-black font-bold uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-mono text-xs uppercase">Descrição</Label>
                                    <Input
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="DETALHES DO PLANO..."
                                        className="rounded-none border-2 border-white/20 bg-black font-bold uppercase"
                                    />
                                </div>

                                <div className="space-y-4 border-t-2 border-white/10 pt-4">
                                    <Label className="font-mono text-xs uppercase text-primary font-black">Insumos do Pacote</Label>
                                    <div className="flex gap-2">
                                        <Select onValueChange={handleAddItem}>
                                            <SelectTrigger className="rounded-none border-2 border-white/20 bg-black font-bold">
                                                <SelectValue placeholder="ADICIONAR INSUMO..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {insumos.map(ins => (
                                                    <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                                        {items.map(item => {
                                            const insumo = insumos.find(i => i.id === item.ingredient_id);
                                            return (
                                                <div key={item.ingredient_id} className="flex items-center justify-between bg-white/5 p-2 border border-white/10">
                                                    <span className="font-mono text-sm uppercase font-bold">{insumo?.name}</span>
                                                    <div className="flex items-center gap-4">
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={e => handleUpdateQuantity(item.ingredient_id, Number(e.target.value))}
                                                            className="w-20 h-8 rounded-none bg-black border-white/20 text-center font-bold"
                                                        />
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.ingredient_id)} className="h-8 w-8 text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    className="w-full h-12 mt-4 rounded-none border-2 border-white bg-white text-black font-black uppercase hover:bg-primary hover:text-white transition-all"
                                    disabled={!name || items.length === 0}
                                >
                                    Confirmar Estrutura
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {packages.map((pkg) => (
                        <Card key={pkg.id} className="rounded-none border-2 border-white/10 bg-black/40 hover:border-primary/50 transition-all group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="font-display text-xl uppercase font-black tracking-tight">{pkg.name}</CardTitle>
                                <PackageIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <p className="font-mono text-xs uppercase text-muted-foreground mb-4">{pkg.description || "Sem descrição"}</p>
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-none border-white/20 font-bold uppercase text-[10px] h-8"
                                        onClick={() => navigate(`/pacotes/${pkg.id}`)}
                                    >
                                        Ver Itens
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {packages.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10">
                            <p className="font-mono text-sm uppercase text-muted-foreground">Nenhum pacote estratégico cadastrado</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
