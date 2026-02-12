import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ChecklistItem, formatCurrency } from "@/lib/mock-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEvent } from "@/hooks/useEvents";

export default function ChecklistSaida() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { event: evento, checklists, saveChecklist } = useEvent(id);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (checklists && checklists.length > 0) {
      const saida = checklists.find(c => c.type === 'saida');
      if (saida && saida.items) {
        setItems(saida.items as ChecklistItem[]);
      } else {
        const entrada = checklists.find(c => c.type === 'entrada');
        if (entrada && entrada.items) {
          // Clone items from entry but reset returns
          setItems((entrada.items as ChecklistItem[]).map(i => ({
            ...i,
            qtyReturned: 0,
            id: Math.random().toString(36).substr(2, 9)
          })));
        }
      }
    }
  }, [checklists]);

  if (!evento) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono animate-pulse uppercase">Sincronizando Conferência...</p>
      </div>
    );
  }

  const handleReturnChange = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentReturn = Number(item.qtyReturned) || 0;
        const maxReturn = item.qtyReceived || item.qtySent;
        const newValue = Math.max(0, Math.min(maxReturn, currentReturn + delta));
        return { ...item, qtyReturned: newValue };
      })
    );
  };

  const calculateConsumo = (item: ChecklistItem) => {
    const received = item.qtyReceived || item.qtySent;
    const returned = item.qtyReturned || 0;
    return Math.max(0, received - returned);
  };

  const calculateCusto = (item: ChecklistItem) => {
    return calculateConsumo(item) * (item.unitPrice || 0);
  };

  const totalCusto = items.reduce((acc, item) => acc + calculateCusto(item), 0);

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await saveChecklist.mutateAsync({
        eventId: id,
        type: 'saida',
        items: items,
        status: 'conferido'
      });
      navigate(`/eventos/${id}`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar conferência final.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-32">
      <header className="sticky top-0 z-50 border-b-2 border-primary/20 bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/eventos/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="truncate font-display text-lg uppercase font-bold">{evento.name}</h1>
            <p className="text-[10px] font-mono uppercase text-muted-foreground">Checklist de Saída (Sobras)</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {items.map((item) => (
          <Card key={item.id} className="rounded-none border-2 border-white/10 bg-black/40">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold uppercase">{item.insumoName}</h3>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase">
                    Entrou: {item.qtyReceived || item.qtySent} | Consumo: {calculateConsumo(item)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-primary">{formatCurrency(calculateCusto(item))}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 p-2 bg-zinc-900/50">
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-none border-2" onClick={() => handleReturnChange(item.id, -1)}>
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="text-center min-w-[80px]">
                  <span className="text-3xl font-display font-black text-white">{item.qtyReturned ?? 0}</span>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Retornou</p>
                </div>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-none border-2" onClick={() => handleReturnChange(item.id, 1)}>
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Totalizer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t-2 border-white/10 bg-black/90 backdrop-blur-xl z-50">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="font-mono text-xs uppercase text-muted-foreground tracking-widest">Custo de Material Real:</span>
          <span className="font-display text-xl font-bold text-success neon-text">{formatCurrency(totalCusto)}</span>
        </div>
        <Button
          className="w-full h-14 font-display font-bold uppercase tracking-widest text-lg rounded-none border-2 border-white shadow-[4px_4px_0px_0px_white] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none bg-primary"
          onClick={() => setShowConfirmDialog(true)}
          disabled={saveChecklist.isPending}
        >
          <Save className="mr-2 h-5 w-5" />
          {saveChecklist.isPending ? "FINALIZANDO..." : "ENCERRAR CONFERÊNCIA"}
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-none border-2 border-white bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase text-2xl">Fechar Evento?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs uppercase">
              Isso calculará o lucro final baseado nestas sobras. O consumo real de material foi de {formatCurrency(totalCusto)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} className="rounded-none bg-success font-bold uppercase">Encerrar com Sucesso</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}