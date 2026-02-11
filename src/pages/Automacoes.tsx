import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAutomations } from '@/hooks/useAutomations';
import { AutomationDialog } from '@/components/automations/AutomationDialog';
import { AutomationCard } from '@/components/automations/AutomationCard';
import { Zap, Plus, Terminal, Activity } from 'lucide-react';
import { useState } from 'react';

export default function Automacoes() {
  const { automations, isLoading, toggleAutomation, deleteAutomation } = useAutomations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <AppLayout title="Automações">
      <div className="min-h-screen bg-background p-4 md:p-8 animate-enter-slide-up font-mono">
        {/* Terminal Header */}
        <div className="mb-12 border-b-2 border-primary/20 pb-8">
          <div className="flex items-center gap-2 text-primary/50 text-xs mb-2">
            <Terminal className="h-4 w-4" />
            <span>SYSTEM_ROOT // AUTOMATION_CONTROLLER</span>
          </div>
          
          <h1 className="font-display text-[8vw] leading-[0.8] uppercase tracking-tighter text-foreground">
            AUTO<span className="text-primary">.MAT_V1</span>
          </h1>

          <div className="mt-8 flex flex-col md:flex-row gap-8 md:items-end justify-between">
             <div className="space-y-1 text-sm text-muted-foreground uppercase">
                <p className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  SYSTEM STATUS: {isLoading ? "SCANNING..." : "ONLINE"}
                </p>
                <p>ACTIVE THREADS: {automations.filter(a => a.active).length}/{automations.length}</p>
             </div>

             <Button
                className="rounded-none bg-primary text-black font-bold uppercase hover:bg-white hover:text-black transition-colors h-14 px-8 text-lg"
                onClick={() => setIsDialogOpen(true)}
             >
                <Plus className="mr-2 h-5 w-5" /> NEW_TRIGGER
             </Button>
          </div>
        </div>

        {/* Create Dialog */}
        <AutomationDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

        {/* Console Output Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {automations.map((auto, i) => (
            <div key={auto.id} className="animate-enter-scale" style={{ animationDelay: `${i * 100}ms` }}>
                <AutomationCard
                  automation={auto}
                  onToggle={(active) => toggleAutomation.mutate({ id: auto.id, active })}
                  onDelete={() => deleteAutomation.mutate(auto.id)}
                />
            </div>
          ))}

          {/* Empty State */}
          {automations.length === 0 && !isLoading && (
            <div className="col-span-full border-2 border-dashed border-white/10 py-20 text-center text-muted-foreground">
              <Zap className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p className="uppercase">NO_ACTIVE_PROTOCOLS</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && automations.length === 0 && (
            <div className="col-span-full py-20 text-center text-primary animate-pulse">
               {'>'} INITIALIZING_SYSTEM...
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
