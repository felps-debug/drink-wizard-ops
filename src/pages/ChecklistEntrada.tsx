import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  eventos,
  checklistItems,
  ChecklistItem,
} from "@/lib/mock-data";
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

export default function ChecklistEntrada() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const evento = eventos.find((e) => e.id === id);
  const eventChecklist = checklistItems.filter((item) => item.eventId === id);

  const [items, setItems] = useState<ChecklistItem[]>(
    eventChecklist.map((item) => ({
      ...item,
      qtyReceived: item.qtyReceived ?? item.qtySent,
    }))
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!evento) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Evento não encontrado</p>
          <Button variant="link" onClick={() => navigate("/eventos")} className="text-primary">
            Voltar para eventos
          </Button>
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
      toast({
        title: "Divergências pendentes",
        description: "Adicione uma justificativa para todos os itens com divergência.",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleSubmit = () => {
    // Aqui salvaria no banco/localStorage
    toast({
      title: "Entrada confirmada!",
      description: "O checklist de entrada foi salvo com sucesso.",
    });
    navigate(`/eventos/${id}`);
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
          disabled={hasUnresolvedDivergences}
        >
          Confirmar Entrada
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