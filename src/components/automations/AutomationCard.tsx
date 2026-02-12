import { AutomationTrigger } from '@/hooks/useAutomations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { BellRing, Trash2 } from 'lucide-react';

interface AutomationCardProps {
  automation: AutomationTrigger;
  onToggle: (active: boolean) => void;
  onDelete: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

const TRIGGER_LABELS: Record<string, string> = {
  checklist_entrada: 'CHECKLIST ENTRADA CONCLUÍDO',
  checklist_saida: 'CHECKLIST SAÍDA CONCLUÍDO',
  event_created: 'NOVO EVENTO AGENDADO',
  'entrada_checklist': 'ENTRADA CHECKLIST CONCLUÍDO',
  'saida_checklist': 'SAÍDA CHECKLIST CONCLUÍDO',
  'evento_agendado': 'NOVO EVENTO AGENDADO',
  'status_entregue': 'EVENTO ENTREGUE (LOCAL)',
  'status_montagem': 'MONTAGEM FINALIZADA'
};

export function AutomationCard({
  automation,
  onToggle,
  onDelete,
  onClick
}: AutomationCardProps) {
  const triggerLabel = TRIGGER_LABELS[automation.trigger_event] ||
    automation.trigger_event
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .toUpperCase();

  const message = automation.action_config?.message || '';

  return (
    <Card
      className="rounded-none border-2 border-white/10 bg-black/40 hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-3 border-b border-white/5">
        <div className="space-y-2 flex-1">
          <CardTitle className="font-display text-xl font-black uppercase text-primary">
            {automation.name}
          </CardTitle>
          <CardDescription className="font-mono text-[11px] font-bold uppercase text-secondary">
            Gatilho: {triggerLabel}
          </CardDescription>
          {automation.trigger_count ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              Disparada {automation.trigger_count}x
              {automation.last_triggered_at && (
                <>
                  {' '}
                  - Última: {new Date(automation.last_triggered_at).toLocaleDateString('pt-BR')}
                </>
              )}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 ml-4" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={automation.active}
            onCheckedChange={onToggle}
            className="cursor-pointer"
            aria-label={`Ativar/Desativar automação ${automation.name}`}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-none cursor-pointer transition-colors duration-200"
            title="Deletar automação"
            aria-label={`Deletar automação ${automation.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex gap-3 rounded-none border border-white/5 bg-white/5 p-3">
          <BellRing className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
          <p className="font-mono text-xs italic leading-relaxed text-muted-foreground break-words">
            "{message}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
