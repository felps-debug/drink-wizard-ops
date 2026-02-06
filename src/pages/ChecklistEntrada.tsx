import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ChecklistItem } from "@/lib/mock-data";
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
import { useInventory } from "@/hooks/useInventory";
import { usePackages } from "@/hooks/usePackages";
import { EventAssignments } from "@/components/events/EventAssignments";

export default function ChecklistEntrada() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { event: evento, checklists, saveChecklist } = useEvent(id);
  const { insumos, isLoading: invLoading } = useInventory();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { getPackageItems } = usePackages();

  useEffect(() => {
    const initItems = async () => {
      if (checklists && checklists.length > 0) {
        const entrada = checklists.find(c => c.type === 'entrada');
        if (entrada && entrada.items) {
          setItems(entrada.items as ChecklistItem[]);
          return;
        }
      }

      // If no checklist exists, check for package items or use inventory
      if (items.length === 0 && insumos.length > 0) {
        let templateItems = [];

        if (evento?.package_id) {
          try {
            const pkgItems = await getPackageItems(evento.package_id);
            if (pkgItems.length > 0) {
              templateItems = pkgItems.map(pi => ({
                id: Math.random().toString(36).substr(2, 9),
                eventId: id || '',
                insumoId: pi.ingredient_id,
                insumoName: pi.ingredient?.name || 'Item do Pacote',
                qtySent: pi.quantity,
                qtyReceived: pi.quantity,
                qtyReturned: null,
                notes: null,
                entryStatus: "pendente" as const,
                exitStatus: "pendente" as const,
                unitPrice: 0 // Will fetch from inventory if needed
              }));
            }
          } catch (e) {
            console.error("Erro ao carregar itens do pacote:", e);
          }
        }

        // Fill remaining or all if no package
        const finalTemplate = insumos.map(ins => {
          const pkgMatch = templateItems.find(ti => ti.insumoId === ins.id);
          if (pkgMatch) {
            return { ...pkgMatch, unitPrice: ins.currentPrice };
          }
          return {
            id: Math.random().toString(36).substr(2, 9),
            eventId: id || '',
            insumoId: ins.id,
            insumoName: ins.name,
            qtySent: 0,
            qtyReceived: 0,
            qtyReturned: null,
            notes: null,
            entryStatus: "pendente" as const,
            exitStatus: "pendente" as const,
            unitPrice: ins.currentPrice
          };
        });

        setItems(finalTemplate);
      }
    };

    initItems();
  }, [checklists, insumos, id, evento?.package_id]);

  if (!evento || invLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center font-mono animate-pulse">
          SINCRONIZANDO MATERIAIS...
        </div>
      </div>
    );
  }

  const handleIncrement = (itemId: string, field: 'qtySent' | 'qtyReceived') => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, [field]: (Number(item[field]) || 0) + 1 }
          : item
      )
    );
  };

  const handleDecrement = (itemId: string, field: 'qtySent' | 'qtyReceived') => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId && (Number(item[field]) || 0) > 0
          ? { ...item, [field]: (Number(item[field]) || 0) - 1 }
          : item
      )
    );
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, notes } : item
      )
    );
  };

  const hasDivergence = (item: ChecklistItem) => {
    return item.qtyReceived !== item.qtySent;
  };

  const hasUnresolvedDivergences = items.some(
    (item) => item.qtySent > 0 && hasDivergence(item) && !item.notes?.trim()
  );

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await saveChecklist.mutateAsync({
        eventId: id,
        type: 'entrada',
        items: items.filter(i => i.qtySent > 0 || i.qtyReceived > 0),
        status: 'conferido'
      });
      navigate(`/eventos/${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="sticky top-0 z-50 border-b-2 border-primary/20 bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/eventos/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="truncate font-display text-lg uppercase font-bold">{evento.clientName}</h1>
            <p className="text-[10px] font-mono uppercase text-muted-foreground">Checklist de Entrada</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {evento.observations && (
          <div className="bg-primary/20 border-2 border-primary p-4 rounded-none flex gap-3 items-start animate-in zoom-in-95 duration-500">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase font-bold text-primary">Observações da Missão</p>
              <p className="text-sm font-bold uppercase leading-tight">{evento.observations}</p>
            </div>
          </div>
        )}

        {items.map((item) => {
          const divergent = hasDivergence(item);
          return (
            <Card key={item.id} className={`rounded-none border-2 bg-black/40 ${divergent && item.qtySent > 0 ? "border-warning/50" : "border-white/10"}`}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-display font-bold uppercase">{item.insumoName}</h3>
                  {divergent && item.qtySent > 0 && (
                    <Badge variant="outline" className="rounded-none border-warning text-warning animate-pulse">
                      Divergência
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8 items-center">
                  {/* QTY SENT (Planned/Loaded) */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono uppercase text-muted-foreground text-center">Enviado</p>
                    <div className="flex items-center justify-between gap-2 border border-white/10 p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDecrement(item.id, 'qtySent')}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-display text-xl">{item.qtySent}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleIncrement(item.id, 'qtySent')}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* QTY RECEIVED (Conferred) */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono uppercase text-primary text-center">Conferido</p>
                    <div className="flex items-center justify-between gap-2 border-2 border-primary/50 p-1 bg-primary/5">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDecrement(item.id, 'qtyReceived')}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-display text-xl text-primary">{item.qtyReceived}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleIncrement(item.id, 'qtyReceived')}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {divergent && item.qtySent > 0 && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label className="text-xs font-bold uppercase text-warning">Justificativa Obrigatória</Label>
                    <Textarea
                      placeholder="Por que os valores divergem?"
                      value={item.notes ?? ""}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      className="rounded-none bg-zinc-900 border-warning/30 min-h-[60px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* EQUIPE SECTION */}
        <div className="pt-6 border-t-2 border-white/10 mt-8">
          <h2 className="font-display text-xl font-bold uppercase text-white mb-4">Equipe do Projeto</h2>
          <EventAssignments
            eventId={id!}
            eventName={evento.clientName}
            eventDate={new Date(evento.date).toLocaleDateString()}
            eventLocation={evento.location}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 border-t-2 border-white/10 bg-background/95 backdrop-blur z-50">
        <Button
          className="w-full h-14 font-display font-bold uppercase tracking-widest text-lg rounded-none border-2 border-white shadow-[4px_4px_0px_0px_white] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          onClick={() => setShowConfirmDialog(true)}
          disabled={hasUnresolvedDivergences || saveChecklist.isPending}
        >
          {saveChecklist.isPending ? "SALVANDO..." : "FINALIZAR ENTRADA"}
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-none border-2 border-white bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase text-2xl">Confirmar Carga?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs uppercase">
              Isso registrará a entrada de materiais para o evento. Deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} className="rounded-none bg-primary border-2 border-primary">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}