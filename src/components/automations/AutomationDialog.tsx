import { useAutomations } from '@/hooks/useAutomations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AutomationForm } from './AutomationForm';

interface AutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutomationDialog({ open, onOpenChange }: AutomationDialogProps) {
  const { createAutomation } = useAutomations();

  const handleSubmit = async (data: {
    name: string;
    trigger_event: string;
    message: string;
  }) => {
    try {
      await createAutomation.mutateAsync({
        name: data.name,
        trigger_event: data.trigger_event,
        action_type: 'whatsapp',
        action_config: {
          message: data.message,
          phone_source: 'event.client_phone',
          delay_seconds: 0,
          max_retries: 3,
        },
        active: true,
      });

      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      // Error is handled by mutation onError
      console.error('Failed to create automation:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl rounded-none border-2 border-white/20 bg-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black uppercase text-primary">
            Nova Automação
          </DialogTitle>
          <p className="font-mono text-xs uppercase text-muted-foreground mt-1">
            Configure um novo gatilho de automação
          </p>
        </DialogHeader>

        <div className="py-4">
          <AutomationForm
            onSubmit={handleSubmit}
            isLoading={createAutomation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
