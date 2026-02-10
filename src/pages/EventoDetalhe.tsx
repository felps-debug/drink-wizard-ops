import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Calendar, DollarSign, CheckCircle2, Clock, Package, PackageCheck, MessageCircle, Wrench, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { useEvent } from "@/hooks/useEvents";
import { OperationalCosts } from "@/components/events/OperationalCosts";
import { EventAssignments } from "@/components/events/EventAssignments";

// Full workflow: agendado → montagem → entregue → em_curso (checklist entrada) → finalizado (checklist saída)
const WORKFLOW_STEPS = [
  { status: 'agendado', label: 'Agendado', icon: Calendar },
  { status: 'montagem', label: 'Montagem', icon: Wrench },
  { status: 'entregue', label: 'Entregue', icon: Truck },
  { status: 'em_curso', label: 'Em Curso', icon: Package },
  { status: 'finalizado', label: 'Finalizado', icon: CheckCircle2 },
] as const;

function getStepIndex(status: string): number {
  return WORKFLOW_STEPS.findIndex(s => s.status === status);
}

export default function EventoDetalhe() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { event: evento, checklists, isLoading, updateEventStatus } = useEvent(id);

  const entryChecklist = checklists.find(c => c.type === 'entrada');
  const exitChecklist = checklists.find(c => c.type === 'saida');
  const entryComplete = !!entryChecklist && entryChecklist.status === 'conferido';
  const exitComplete = !!exitChecklist && exitChecklist.status === 'conferido';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono animate-pulse">CARREGANDO...</p>
      </div>
    );
  }

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

  const canEdit = user && ['admin', 'chefe_bar'].includes(user.role);
  const isMontador = user?.role === 'montador' || user?.role === 'admin';
  const currentStepIndex = getStepIndex(evento.status);

  const handleStatusTransition = (newStatus: string, triggerName: string) => {
    if (!id) return;
    updateEventStatus.mutate({ eventId: id, newStatus, triggerName });
  };

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
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="hidden md:flex gap-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
              onClick={() => {
                toast.success("Enviando mensagem via Evolution API...");
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Notificar Cliente
            </Button>
            <Badge className={getStatusColor(evento.status)}>
              {getStatusLabel(evento.status)}
            </Badge>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {/* Event Info */}
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
              {user?.role === 'admin' && (
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatCurrency(evento.contractValue)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Pipeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Fluxo do Evento</h2>

          {/* Visual Pipeline */}
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {WORKFLOW_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step.status} className="flex items-center">
                  <div className={`flex flex-col items-center gap-1 min-w-[60px] ${isCompleted ? 'text-green-400' : isCurrent ? 'text-primary' : 'text-muted-foreground/40'
                    }`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${isCompleted ? 'border-green-400 bg-green-400/20' :
                        isCurrent ? 'border-primary bg-primary/20 animate-pulse' :
                          'border-muted-foreground/20 bg-muted/20'
                      }`}>
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <span className="text-[10px] font-mono uppercase text-center leading-tight">{step.label}</span>
                  </div>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className={`h-[2px] w-6 mx-0.5 ${index < currentStepIndex ? 'bg-green-400' : 'bg-muted-foreground/20'
                      }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons based on current status */}
          <div className="space-y-3">
            {/* Montagem Finalizada — available when status is 'agendado' */}
            {evento.status === 'agendado' && isMontador && (
              <Button
                className="h-auto w-full min-h-[64px] justify-between p-4 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => handleStatusTransition('montagem', 'montagem_finalizada')}
                disabled={updateEventStatus.isPending}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Montagem Finalizada</p>
                    <p className="text-xs opacity-80">Sinalizar que o equipamento foi montado</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  <Clock className="mr-1 h-3 w-3" />
                  Pendente
                </Badge>
              </Button>
            )}

            {/* Entrega Confirmada — available when status is 'montagem' */}
            {evento.status === 'montagem' && isMontador && (
              <Button
                className="h-auto w-full min-h-[64px] justify-between p-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleStatusTransition('entregue', 'entrega_confirmada')}
                disabled={updateEventStatus.isPending}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Entrega Confirmada</p>
                    <p className="text-xs opacity-80">Confirmar que o evento foi entregue no local</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  <Clock className="mr-1 h-3 w-3" />
                  Pendente
                </Badge>
              </Button>
            )}

            {/* Completed status pills for done steps */}
            {currentStepIndex > 0 && (
              <div className="flex flex-wrap gap-2">
                {evento.status !== 'agendado' && (
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Montagem OK
                  </Badge>
                )}
                {(evento.status === 'entregue' || evento.status === 'em_curso' || evento.status === 'finalizado') && (
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Entrega OK
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Checklists Section — only visible after entrega confirmed */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Checklists</h2>

          {getStepIndex(evento.status) < getStepIndex('entregue') ? (
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed border-white/10 rounded-lg">
              <Truck className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Checklists disponíveis após a entrega do evento.</p>
              <p className="text-xs mt-1 opacity-60">Complete as etapas de montagem e entrega primeiro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Checklist Entrada */}
              <Link to={`/eventos/${id}/checklist-entrada`}>
                <Button
                  variant="outline"
                  className="h-auto w-full min-h-[72px] justify-between p-4"
                  disabled={!canEdit && !isMontador}
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

              {/* Checklist Saída — Bloqueado até entrada concluída */}
              <Link
                to={entryComplete ? `/eventos/${id}/checklist-saida` : "#"}
                onClick={(e) => !entryComplete && e.preventDefault()}
              >
                <Button
                  variant="outline"
                  className="h-auto w-full min-h-[72px] justify-between p-4 mt-3"
                  disabled={(!canEdit && !isMontador) || !entryComplete}
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

        {/* Operational Costs & Staff Section (Admin only) */}
        {user?.role === 'admin' && (
          <div className="space-y-8 pt-4 border-t border-white/10">
            <div>
              <h2 className="text-lg font-semibold mb-4">Escala e Custos Operacionais</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <EventAssignments eventId={id!} eventName={evento.clientName || 'Evento'} eventDate={formatDate(evento.date)} />
                <OperationalCosts eventId={id!} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}