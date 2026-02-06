import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { insumos as mockInsumos, formatCurrency, Insumo } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { useInventory } from "@/hooks/useInventory";
import { IngredientDialog } from "@/components/inventory/IngredientDialog";

export default function Insumos() {
  const { user } = useAuth();
  const { insumos, isLoading, addInsumo, updateInsumo } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | undefined>(undefined);

  const categories = ["all", ...new Set(insumos.map((i) => i.category))];

  const filteredInsumos = insumos.filter((insumo) => {
    const matchesSearch = insumo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || insumo.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEditClick = (insumo: Insumo) => {
    setSelectedInsumo(insumo);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedInsumo(undefined);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (data: Omit<Insumo, "id">) => {
    if (selectedInsumo) {
      await updateInsumo.mutateAsync({ ...data, id: selectedInsumo.id });
    } else {
      await addInsumo.mutateAsync(data);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Insumos">
        <div className="flex items-center justify-center p-8">
          <p className="font-mono animate-pulse">CARREGANDO ESTOQUE...</p>
        </div>
      </AppLayout>
    );
  }

  const groupedInsumos = filteredInsumos.reduce(
    (acc, insumo) => {
      if (!acc[insumo.category]) {
        acc[insumo.category] = [];
      }
      acc[insumo.category].push(insumo);
      return acc;
    },
    {} as Record<string, typeof insumos>
  );

  return (
    <AppLayout title="Insumos">
      <div className="space-y-6 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-3xl font-bold uppercase text-white">Controle de Estoque</h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              placeholder="BUSCAR INSUMO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 font-mono uppercase bg-zinc-900 border-white/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              className={`shrink-0 border-2 font-bold uppercase tracking-wider ${categoryFilter === cat
                ? "bg-primary text-white border-primary"
                : "bg-transparent text-muted-foreground border-white/20 hover:border-primary hover:text-white"
                }`}
            >
              {cat === "all" ? "Todos" : cat}
            </Button>
          ))}
        </div>

        {/* Insumos List by Category */}
        <div className="space-y-8 pb-20">
          {Object.entries(groupedInsumos).map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-4 font-display text-xl font-bold uppercase text-primary border-b-2 border-primary/20 pb-2">{category}</h3>
              <div className="grid gap-3">
                {items.map((insumo) => (
                  <Card
                    key={insumo.id}
                    className="group rounded-none border-2 border-white/10 bg-card transition-all hover:border-white hover:bg-white/5 cursor-pointer"
                    onClick={() => user?.role === 'admin' && handleEditClick(insumo)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-display text-lg font-bold uppercase text-white group-hover:text-primary transition-colors">{insumo.name}</p>
                        <p className="font-mono text-xs uppercase text-muted-foreground tracking-wide">Unidade: {insumo.unit}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {user && user.role === "admin" && (
                          <Edit className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        {user && user.role === "admin" && (
                          <div className="text-right">
                            <Badge className="rounded-none border-2 border-primary bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary block mb-1">
                              {formatCurrency(insumo.currentPrice)}
                            </Badge>
                            {insumo.currentStock !== undefined && (
                              <p className={cn(
                                "font-mono text-[10px] uppercase font-bold",
                                insumo.currentStock <= (insumo.minStock || 0) ? "text-destructive" : "text-success"
                              )}>
                                Estoque: {insumo.currentStock} {insumo.unit}
                                {insumo.currentStock <= (insumo.minStock || 0) && " ⚠️"}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedInsumos).length === 0 && (
            <div className="border-2 border-dashed border-white/20 py-12 text-center">
              <p className="font-mono text-sm uppercase text-muted-foreground">Nenhum insumo encontrado</p>
            </div>
          )}
        </div>

        {/* FAB - New Insumo */}
        {user && user.role === "admin" && (
          <Button
            size="lg"
            onClick={handleAddNew}
            className="fixed bottom-24 right-4 h-16 w-16 rounded-none border-2 border-white bg-primary text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-primary hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] z-50"
          >
            <Plus className="h-8 w-8" />
          </Button>
        )}

        {/* Edit/Create Dialog */}
        <IngredientDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleFormSubmit}
          initialData={selectedInsumo}
        />
      </div>
    </AppLayout>
  );
}