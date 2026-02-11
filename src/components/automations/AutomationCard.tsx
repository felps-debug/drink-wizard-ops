import { AutomationTrigger } from '@/hooks/useAutomations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { BellRing, Trash2 } from 'lucide-react';

interface AutomationCardProps {
  automation: AutomationTrigger;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}

const TRIGGER_LABELS: Record<string, string> = {
  checklist_entrada: 'CHECKLIST ENTRADA CONCLUÍDO',
  checklist_saida: 'CHECKLIST SAÍDA CONCLUÍDO',
  event_created: 'NOVO EVENTO AGENDADO',
  'entrada_checklist': 'ENTRADA CHECKLIST CONCLUÍDO',
  'saida_checklist': 'SAÍDA CHECKLIST CONCLUÍDO',
  'evento_agendado': 'NOVO EVENTO AGENDADO'
};

export function AutomationCard({
  automation,
  onToggle,
  onDelete
}: AutomationCardProps) {
  const triggerLabel = TRIGGER_LABELS[automation.trigger_event] ||
    automation.trigger_event
      .replace(/_/g, ' ')
      .toUpperCase();

  const message = automation.action_config?.message || '';

  return (
    <div className={`group relative p-4 transition-all duration-300 border-l-2 ${automation.active ? 'border-primary bg-primary/5' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
      {/* Header / Status Line */}
      <div className="flex items-start justify-between mb-4 font-mono">
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                <span className={automation.active ? "text-primary animate-pulse" : "text-muted-foreground"}>
                    ● {automation.active ? "RUNNING" : "STOPPED"}
                </span>
                <span className="text-muted-foreground/30">|</span>
                <span className="text-foreground font-bold">{automation.name}</span>
            </div>
            <div className="text-[10px] text-muted-foreground flex gap-2">
                <span>TRIGGER: {triggerLabel}</span>
                {automation.trigger_count > 0 && <span>(COUNT: {automation.trigger_count})</span>}
            </div>
        </div>

        <div className="flex items-center gap-4">
            <Switch
                checked={automation.active}
                onCheckedChange={onToggle}
                className="data-[state=checked]:bg-primary"
            />
            <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-transparent -mr-2"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* Action / Message Block */}
      <div className="font-mono text-xs border border-white/10 p-3 bg-black/50 text-muted-foreground group-hover:text-foreground transition-colors relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/20" />
        <span className="text-primary/50 mr-2">$</span>
        sendMessage("{message}")
      </div>
    </div>
  );
}
