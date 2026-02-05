import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Insumo } from "@/lib/mock-data";
import { useEffect, useState } from "react";

interface IngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Insumo, "id">) => Promise<void>;
  initialData?: Insumo;
}

const CATEGORIES = ["Destilados", "Licores", "Xaropes", "Frutas", "Outros"];
const UNITS = ["ml", "l", "kg", "g", "unidade"];

export function IngredientDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: IngredientDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [minStock, setMinStock] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setCategory(initialData.category);
        setUnit(initialData.unit);
        setMinStock(initialData.minStock.toString());
      } else {
        // Reset form for new item
        setName("");
        setCategory("");
        setUnit("");
        setMinStock("");
      }
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit({
        name,
        category,
        unit,
        minStock: Number(minStock) || 0,
        currentPrice: 0 // Default for now
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
      <DialogContent className="border-2 border-white bg-zinc-950 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase">
            {initialData ? "Editar Insumo" : "Novo Insumo"}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs uppercase text-muted-foreground">
            {initialData
              ? "Altere os dados do insumo selecionado."
              : "Adicione um novo item ao estoque."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="font-mono text-xs uppercase">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-white/20 bg-black font-bold uppercase focus:border-primary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category" className="font-mono text-xs uppercase">
                Categoria
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="border-white/20 bg-black font-bold uppercase focus:ring-primary">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit" className="font-mono text-xs uppercase">
                Unidade
              </Label>
              <Select value={unit} onValueChange={setUnit} required>
                <SelectTrigger className="border-white/20 bg-black font-bold uppercase focus:ring-primary">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="minStock" className="font-mono text-xs uppercase">
              Estoque Mínimo
            </Label>
            <Input
              id="minStock"
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="border-white/20 bg-black font-bold focus:border-primary"
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-2 border-white/20 uppercase hover:bg-white/10"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="border-2 border-primary bg-primary font-bold uppercase text-white hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
