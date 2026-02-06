import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Automation {
  id: string;
  name: string;
  event_type: string;
  action_type: string;
  template_message: string;
  active: boolean;
  created_at?: string;
}

export const useAutomations = () => {
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['magodosdrinks_triggers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('magodosdrinks_triggers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Automation[];
    }
  });

  const createAutomation = useMutation({
    mutationFn: async (newAuto: Omit<Automation, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('magodosdrinks_triggers')
        .insert([newAuto])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['magodosdrinks_triggers'] });
      toast.success("AUTOMAÇÃO CRIADA!");
    },
    onError: (err: any) => {
      toast.error("ERRO AO CRIAR AUTOMAÇÃO: " + err.message);
    }
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      const { error } = await supabase
        .from('magodosdrinks_triggers')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['magodosdrinks_triggers'] });
    }
  });

  return {
    automations,
    isLoading,
    createAutomation,
    toggleAutomation
  };
};
