import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface AutomationTrigger {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  trigger_event: string; // 'checklist_entrada', 'checklist_saida', 'event_created'
  trigger_conditions?: Record<string, any>;
  action_type: string; // 'whatsapp', 'email'
  action_config: {
    message: string;
    phone_source?: string;
    delay_seconds?: number;
    max_retries?: number;
  };
  last_triggered_at?: string;
  trigger_count?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const useAutomations = () => {
  const queryClient = useQueryClient();

  // Fetch all automations from automation_triggers table
  const { data: automations = [], isLoading, error } = useQuery({
    queryKey: ['automation_triggers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_triggers')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as AutomationTrigger[];
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Create new automation
  const createAutomation = useMutation({
    mutationFn: async (
      newAuto: Omit<
        AutomationTrigger,
        'id' | 'created_at' | 'updated_at' | 'trigger_count' | 'last_triggered_at' | 'created_by'
      >
    ) => {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Insert with created_by
      const { data, error } = await supabase
        .from('automation_triggers')
        .insert([{
          ...newAuto,
          created_by: user.id
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_triggers'] });
      toast.success('AUTOMAÇÃO CRIADA!');
    },
    onError: (err: any) => {
      toast.error(`ERRO: ${err.message}`);
    }
  });

  // Update automation
  const updateAutomation = useMutation({
    mutationFn: async (automation: AutomationTrigger) => {
      const { error } = await supabase
        .from('automation_triggers')
        .update(automation)
        .eq('id', automation.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_triggers'] });
      toast.success('AUTOMAÇÃO ATUALIZADA!');
    },
    onError: (err: any) => {
      toast.error(`ERRO: ${err.message}`);
    }
  });

  // Toggle active status
  const toggleAutomation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('automation_triggers')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_triggers'] });
    }
  });

  // Delete automation
  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_triggers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_triggers'] });
      toast.success('AUTOMAÇÃO DELETADA!');
    },
    onError: (err: any) => {
      toast.error(`ERRO: ${err.message}`);
    }
  });

  return {
    automations,
    isLoading,
    error,
    createAutomation,
    updateAutomation,
    toggleAutomation,
    deleteAutomation
  };
};
