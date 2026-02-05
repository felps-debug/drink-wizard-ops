import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Calendar, DollarSign, CheckCircle2, Clock, Package, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  eventos,
  checklistItems,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  currentUser,
} from "@/lib/mock-data";

export default function EventoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const evento = eventos.find((e) => e.id === id);
  const eventChecklist = checklistItems.filter((item) => item.eventId === id);

  // Calcular status dos checklists
  const entryComplete = eventChecklist.length > 0 && eventChecklist.every((item) => item.entryStatus === "conferido");
  const exitComplete = eventChecklist.length > 0 && eventChecklist.every((item) => item.exitStatus === "conferido");

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

  const canEdit = currentUser.role === "admin" || currentUser.role === "chefe_bar";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/eventos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="truncate font-semibold">{evento.clientName}</h1>
          </div>
          <Badge className={getStatusColor(evento.status)}>
            {getStatusLabel(evento.status)}
          </Badge>
        </div>
      </header>

      {/* Event Info */}
      <div className="space-y-4 p-4">
        <Card className="card-gradient border-0">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{evento.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <span>{evento.clientPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formatDate(evento.date)}</span>
              </div>
              {currentUser.role === "admin" && (
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatCurrency(evento.contractValue)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Buttons - Mobile First (min 44x44px) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Checklists</h2>

          {eventChecklist.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum item cadastrado para este evento
            </p>
          ) : (
            <div className="space-y-3">
              {/* Botão Checklist Entrada */}
              <Link to={`/eventos/${id}/checklist-entrada`}>
                <Button
                  variant="outline"
                  className="h-auto w-full min-h-[72px] justify-between p-4"
                  disabled={!canEdit}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Checklist Entrada</p>
                      <p className="text-sm text-muted-foreground">
                        Conferir materiais recebidos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entryComplete ? (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Concluído
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                </Button>
              </Link>

              {/* Botão Checklist Saída - AC1: Bloqueado até entrada concluída */}
              <Link 
                to={entryComplete ? `/eventos/${id}/checklist-saida` : "#"}
                onClick={(e) => !entryComplete && e.preventDefault()}
              >
                <Button
                  variant="outline"
                  className="h-auto w-full min-h-[72px] justify-between p-4"
                  disabled={!canEdit || !entryComplete}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${entryComplete ? "bg-primary/10" : "bg-muted"}`}>
                      <PackageCheck className={`h-6 w-6 ${entryComplete ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Checklist Saída</p>
                      <p className="text-sm text-muted-foreground">
                        {entryComplete ? "Registrar sobras e consumo" : "Complete a entrada primeiro"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {exitComplete ? (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Concluído
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}