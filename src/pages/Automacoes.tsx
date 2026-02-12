import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAutomations, AutomationTrigger } from '@/hooks/useAutomations';
import { AutomationDialog } from '@/components/automations/AutomationDialog';
import { AutomationCard } from '@/components/automations/AutomationCard';
import { Zap, Plus } from 'lucide-react';
import { useState } from 'react';

export default function Automacoes() {
  const { automations, isLoading, toggleAutomation, deleteAutomation } = useAutomations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationTrigger | undefined>(undefined);

  const handleEdit = (automation: AutomationTrigger) => {
    setSelectedAutomation(automation);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedAutomation(undefined);
    setIsDialogOpen(true);
  };

  return (
    <AppLayout title="Automações">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-foreground pb-4">
          <div>
            <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-primary">
              Automações
            </h1>
            <p className="font-mono text-xs uppercase text-muted-foreground">
              Logística & Notificações Inteligentes
            </p>
          </div>
          <Button
            className="rounded-none border-2 border-primary bg-primary font-bold uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-200 cursor-pointer"
            onClick={handleCreate}
            aria-label="Criar novo gatilho de automação"
          >
            <Plus className="mr-2 h-4 w-4" /> Criar Gatilho
          </Button>
        </div>

        {/* Create Dialog */}
        <AutomationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          initialData={selectedAutomation}
        />

        {/* Automation Cards Grid */}
        <div className="grid gap-4">
          {automations.map((auto) => (
            <AutomationCard
              key={auto.id}
              automation={auto}
              onToggle={(active) => toggleAutomation.mutate({ id: auto.id, active })}
              onDelete={() => deleteAutomation.mutate(auto.id)}
              onClick={() => handleEdit(auto)}
            />
          ))}

          {/* Empty State */}
          {automations.length === 0 && !isLoading && (
            <div className="border-2 border-dashed border-white/10 py-20 text-center">
              <Zap className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" aria-hidden="true" />
              <p className="font-mono text-sm uppercase text-muted-foreground">
                O sistema ainda não está operando no automático
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && automations.length === 0 && (
            <div className="border-2 border-dashed border-white/10 py-20 text-center">
              <p className="font-mono text-sm uppercase text-muted-foreground">
                Carregando automações...
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
