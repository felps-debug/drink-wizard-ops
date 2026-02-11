
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInventory } from "@/hooks/useInventory";
import { usePackages } from "@/hooks/usePackages";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PackageDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { packages, updatePackage, deletePackage } = usePackages();
    const { insumos } = useInventory();

    // Local state for editing
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [items, setItems] = useState<{ ingredient_id: string; quantity: number }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch single package details + items
    // ideally usePackages would have a usePackage(id) hook, but we can query here or find from list
    const pkg = packages.find(p => p.id === id);

    // Fetch items for this package
    const { data: packageItems = [], isLoading: loadingItems } = useQuery({
        queryKey: ['package_items', id],
        queryFn: async () => {
            if (!id) return [];
            const { data, error } = await supabase
                .from('magodosdrinks_package_items')
                .select('*, ingredient:ingredients(name, unit)')
                .eq('package_id', id);
            if (error) throw error;
            return data;
        },
        enabled: !!id
    });

    // Load data into state when available
    useEffect(() => {
        if (pkg) {
            setName(pkg.name);
            setDescription(pkg.description || "");
        }
    }, [pkg]);

    useEffect(() => {
        if (packageItems.length > 0) {
            setItems(packageItems.map(item => ({
                ingredient_id: item.ingredient_id,
                quantity: item.quantity
            })));
        }
    }, [packageItems]);


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

    const handleSave = async () => {
        if (!id || !name) return;
        setIsSaving(true);
        try {
            await updatePackage.mutateAsync({
                id,
                name,
                description,
                items
            });
            // navigate("/pacotes"); // Stay on page or go back? Maybe stay to show success
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        await deletePackage.mutateAsync(id);
        navigate("/pacotes");
    };

    if (!pkg && !loadingItems) {
        return (
            <AppLayout title="Pacote Não Encontrado">
                <div className="p-12 text-center">
                    <h1 className="text-2xl font-display uppercase">Pacote não encontrado</h1>
                    <Button onClick={() => navigate("/pacotes")} className="mt-4">
                        Voltar
                    </Button>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout title={pkg ? pkg.name : "Carregando..."}>
            <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-4 border-foreground pb-6">
                    <div>
                        <Button variant="ghost" onClick={() => navigate("/pacotes")} className="mb-2 pl-0 hover:bg-transparent hover:text-primary font-mono text-xs uppercase">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para Pacotes
                        </Button>
                        <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-foreground">
                            Editando Pacote
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="border-2 border-destructive font-bold uppercase">
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-2 border-white bg-zinc-950 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-display uppercase text-destructive">Excluir Pacote?</AlertDialogTitle>
                                    <AlertDialogDescription className="font-mono text-zinc-400">
                                        Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="border-white/20 uppercase hover:bg-white/10">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground font-bold uppercase hover:bg-destructive/90">
                                        Sim, Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button onClick={handleSave} disabled={isSaving} className="border-2 border-primary bg-primary font-bold uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {isSaving ? "Salvando..." : <>
                                <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                            </>}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* General Info */}
                    <Card className="md:col-span-1 border-2 border-border h-fit">
                        <CardHeader>
                            <CardTitle className="font-display text-xl uppercase">Informações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-mono text-xs uppercase">Nome do Pacote</Label>
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="font-bold uppercase border-2 focus:border-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-mono text-xs uppercase">Descrição</Label>
                                <Input
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="font-bold uppercase border-2 focus:border-primary"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Itens */}
                    <Card className="md:col-span-2 border-2 border-primary bg-primary/5">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="font-display text-xl uppercase text-primary">Insumos do Pacote</CardTitle>
                            <div className="w-[200px]">
                                <Select onValueChange={handleAddItem}>
                                    <SelectTrigger className="rounded-none border-2 border-primary/20 bg-background font-bold h-8">
                                        <SelectValue placeholder="ADICIONAR..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {insumos.map(ins => (
                                            <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {items.length === 0 ? (
                                    <p className="text-center font-mono text-xs uppercase text-muted-foreground py-8">Nenhum insumo neste pacote.</p>
                                ) : items.map(item => {
                                    const insumo = insumos.find(i => i.id === item.ingredient_id);
                                    return (
                                        <div key={item.ingredient_id} className="flex items-center justify-between bg-background p-3 border border-border">
                                            <div className="flex flex-col">
                                                <span className="font-display font-bold uppercase">{insumo?.name}</span>
                                                <span className="font-mono text-[10px] text-muted-foreground uppercase">{insumo?.category} ({insumo?.unit})</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => handleUpdateQuantity(item.ingredient_id, Number(e.target.value))}
                                                    className="w-20 h-8 rounded-none border-primary/20 text-center font-bold"
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.ingredient_id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
