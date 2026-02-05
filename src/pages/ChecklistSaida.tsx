import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  eventos,
  checklistItems,
  ChecklistItem,
  formatCurrency,
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

export default function ChecklistSaida() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const evento = eventos.find((e) => e.id === id);
  const eventChecklist = checklistItems.filter((item) => item.eventId === id);

  const [items, setItems] = useState<ChecklistItem[]>(
    eventChecklist.map((item) => ({
      ...item,
      qtyReturned: item.qtyReturned ?? 0,
    }))
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

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
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const maxReturn = item.qtyReceived ?? item.qtySent;
        const newValue = Math.min((item.qtyReturned ?? 0) + 1, maxReturn);
        return { ...item, qtyReturned: newValue };
      })
    );
  };

  const handleDecrement = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId && (item.qtyReturned ?? 0) > 0
          ? { ...item, qtyReturned: (item.qtyReturned ?? 0) - 1 }
          : item
      )
    );
  };

  const getConsumo = (item: ChecklistItem) => {
    const received = item.qtyReceived ?? item.qtySent;
    const returned = item.qtyReturned ?? 0;
    return received - returned;
  };

  const getCustoItem = (item: ChecklistItem) => {
    return getConsumo(item) * item.unitPrice;
  };

  const totalCusto = items.reduce((acc, item) => acc + getCustoItem(item), 0);

  const handleShowSummary = () => {
    setShowSummary(true);
  };

  const handleConfirmExit = () => {
    setShowSummary(false);
    setShowConfirmDialog(true);
  };

  const handleSubmit = () => {
    // Aqui salvaria no banco/localStorage
    toast({
      title: "Evento finalizado!",
      description: "O checklist de saída foi salvo e o evento foi encerrado.",
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
            <h1 className="truncate font-semibold">Checklist Saída</h1>
            <p className="text-xs text-muted-foreground">{evento.clientName}</p>
          </div>
        </div>
      </header>

      {/* Items List */}
      <div className="flex-1 space-y-3 p-4">
        {items.map((item) => {
          const consumo = getConsumo(item);
          const custo = getCustoItem(item);
          return (
            <Card key={item.id} className="card-gradient border-0">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.insumoName}</p>
                    <p className="text-sm text-muted-foreground">
                      Recebido: <span className="font-medium text-foreground">{item.qtyReceived ?? item.qtySent}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="border-primary text-primary">
                      Consumo: {consumo}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(custo)}
                    </p>
                  </div>
                </div>

                {/* Controles +/- para retorno */}
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
                    <span className="text-2xl font-bold">{item.qtyReturned ?? 0}</span>
                    <p className="text-xs text-muted-foreground">Sobrou</p>
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer with Total */}
      <div className="sticky bottom-0 border-t border-border/40 bg-background p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Custo total estimado:</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(totalCusto)}</span>
        </div>
        <Button
          className="w-full min-h-[48px]"
          onClick={handleShowSummary}
        >
          Salvar e Finalizar
        </Button>
      </div>

      {/* Summary Dialog */}
      <AlertDialog open={showSummary} onOpenChange={setShowSummary}>
        <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Resumo de Encerramento</AlertDialogTitle>
            <AlertDialogDescription>
              Confira o consumo total antes de finalizar
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2 py-4">
            {items.map((item) => {
              const consumo = getConsumo(item);
              const custo = getCustoItem(item);
              return (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.insumoName}</span>
                  <div className="text-right">
                    <span className="font-medium">{consumo} un</span>
                    <span className="ml-2 text-muted-foreground">{formatCurrency(custo)}</span>
                  </div>
                </div>
              );
            })}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(totalCusto)}</span>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AC4: Final Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja encerrar o evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá finalizar o evento "{evento.clientName}" e enviar os dados. 
              Não será possível editar após a confirmação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Encerrar Evento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}