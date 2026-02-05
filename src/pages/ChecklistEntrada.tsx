import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ChecklistItem, checklistItems as mockChecklistItems } from "@/lib/mock-data";
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

export default function ChecklistEntrada() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Use hook to fetch real data
  const { event: evento, checklists, saveChecklist } = useEvent(id);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize Items
  useEffect(() => {
    if (checklists && checklists.length > 0) {
      const entrada = checklists.find(c => c.type === 'entrada');
      if (entrada && entrada.items) {
        // Safe check for JSON format, assuming simple array of ChecklistItem
         setItems(entrada.items as ChecklistItem[])
      } else {
        // Fallback to mock logic if new
        // Ideally should fetch "Planned Items" for this event. 
        // For now using mock template
        const mockTemplate = mockChecklistItems.filter((item) => item.eventId === '1'); // Check mocks
        // If empty, map empty
        setItems(mockTemplate.map(i => ({...i, eventId: id || '', qtyReceived: i.qtySent})));
      }
    } else {
         // Fallback default
         const mockTemplate = mockChecklistItems.filter((item) => item.eventId === '1'); 
         setItems(mockTemplate.map(i => ({...i, eventId: id || '', qtyReceived: i.qtySent})));
    }
  }, [checklists, id]);


  if (!evento) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Evento não encontrado/Carregando...</p>
        </div>
      </div>
    );
  }

  const handleIncrement = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, qtyReceived: (item.qtyReceived ?? 0) + 1 }
          : item
      )
    );
  };

  const handleDecrement = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId && (item.qtyReceived ?? 0) > 0
          ? { ...item, qtyReceived: (item.qtyReceived ?? 0) - 1 }
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
    (item) => hasDivergence(item) && !item.notes?.trim()
  );

  const handleConfirmEntry = () => {
    if (hasUnresolvedDivergences) {
      toast.error("Adicione uma justificativa para todos os itens com divergência.");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await saveChecklist.mutateAsync({
        eventId: id,
        type: 'entrada',
        items: items,
        status: 'conferido'
      });
      navigate(`/eventos/${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/eventos/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="truncate font-semibold">Checklist Entrada</h1>
            <p className="text-xs text-muted-foreground">{evento.clientName}</p>
          </div>
        </div>
      </header>

      {/* Items List */}
      <div className="flex-1 space-y-3 p-4">
        {items.map((item) => {
          const divergent = hasDivergence(item);
          return (
            <Card key={item.id} className={`card-gradient border-0 ${divergent ? "ring-2 ring-warning" : ""}`}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.insumoName}</p>
                    <p className="text-sm text-muted-foreground">
                      Enviado: <span className="font-medium text-foreground">{item.qtySent}</span>
                    </p>
                  </div>
                  {divergent && (
                    <Badge variant="outline" className="border-warning text-warning">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Divergência
                    </Badge>
                  )}
                </div>

                {/* Controles +/- */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => handleDecrement(item.id)}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="min-w-[60px] text-center">
                    <span className="text-2xl font-bold">{item.qtyReceived ?? 0}</span>
                    <p className="text-xs text-muted-foreground">Recebido</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => handleIncrement(item.id)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                {/* AC2: Campo de justificativa obrigatório se divergência */}
                {divergent && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-warning">
                      Justificativa obrigatória *
                    </label>
                    <Textarea
                      placeholder="Explique a divergência..."
                      value={item.notes ?? ""}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Button */}
      <div className="sticky bottom-0 border-t border-border/40 bg-background p-4">
        <Button
          className="w-full min-h-[48px]"
          onClick={handleConfirmEntry}
          disabled={hasUnresolvedDivergences || saveChecklist.isPending}
        >
          {saveChecklist.isPending ? "Salvando..." : "Confirmar Entrada"}
        </Button>
        {hasUnresolvedDivergences && (
          <p className="mt-2 text-center text-xs text-warning">
            Justifique todas as divergências para continuar
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar entrada de materiais?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está confirmando o recebimento de {items.length} itens para o evento "{evento.clientName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}