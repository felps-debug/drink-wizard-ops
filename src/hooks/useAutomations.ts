import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Automation, NewAutomation } from "@/types/automation";
import { toast } from "sonner";

export function useAutomations() {
  const queryClient = useQueryClient();

  const { data: automations, isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Automation[];
    },
  });

  const addAutomation = useMutation({
    mutationFn: async (newAutomation: NewAutomation) => {
      const { data, error } = await supabase
        .from("automations")
        .insert([newAutomation])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automação criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar automação: " + error.message);
    },
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("automations")
        .update({ active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Status atualizado!");
    },
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automação removida.");
    },
  });

  return {
    automations: automations || [],
    isLoading,
    addAutomation,
    toggleAutomation,
    deleteAutomation
  };
}
