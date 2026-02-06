import { useState } from "react";
import { useOperationalCosts } from "@/hooks/useOperationalCosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";

export function OperationalCosts({ eventId }: { eventId: string }) {
    const { costs, addCost, deleteCost } = useOperationalCosts(eventId);
    const [description, setDescription] = useState("");
    const [value, setValue] = useState("");
    const [category, setCategory] = useState("Logística");

    const handleAdd = () => {
        if (!description || !value) return;
        addCost.mutate({
            event_id: eventId,
            description,
            value: Number(value),
            category
        });
        setDescription("");
        setValue("");
    };

    const total = costs.reduce((acc, current) => acc + Number(current.value), 0);

    return (
        <Card className="rounded-none border-2 border-white/10 bg-black/20">
            <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg uppercase flex items-center justify-between">
                    Custos Operacionais
                    <span className="text-primary font-mono text-sm">{formatCurrency(total)}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="font-mono text-[10px] uppercase">Descrição</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Gasolina"
                            className="h-9 bg-zinc-900 border-white/10"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="font-mono text-[10px] uppercase">Valor (R$)</Label>
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="0.00"
                            className="h-9 bg-zinc-900 border-white/10 font-bold"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button onClick={handleAdd} className="w-full h-9 bg-primary" disabled={addCost.isPending}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                        </Button>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {costs.map((cost) => (
                        <div key={cost.id} className="flex items-center justify-between p-2 border border-white/5 bg-zinc-900/50">
                            <div>
                                <p className="font-bold text-sm uppercase">{cost.description}</p>
                                <p className="font-mono text-[10px] text-muted-foreground uppercase">{cost.category}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-sm">{formatCurrency(cost.value)}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => deleteCost.mutate(cost.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {costs.length === 0 && (
                        <p className="text-center py-4 font-mono text-xs text-muted-foreground uppercase">Nenhum custo extra registrado.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
