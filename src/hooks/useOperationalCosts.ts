import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface OperationalCost {
    id: string;
    event_id: string;
    description: string;
    value: number;
    category: string;
    created_at: string;
}

export function useOperationalCosts(eventId?: string) {
    const queryClient = useQueryClient();

    const { data: costs = [], isLoading } = useQuery({
        queryKey: ["operational-costs", eventId],
        queryFn: async () => {
            let query = supabase.from("operational_costs").select("*");
            if (eventId) {
                query = query.eq("event_id", eventId);
            }
            const { data, error } = await query.order("created_at", { ascending: false });
            if (error) throw error;
            return data as OperationalCost[];
        },
    });

    const addCost = useMutation({
        mutationFn: async (newCost: Omit<OperationalCost, "id" | "created_at">) => {
            const { data, error } = await supabase
                .from("operational_costs")
                .insert([newCost])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["operational-costs"] });
            toast.success("Custo registrado!");
        },
        onError: (error) => toast.error("Erro: " + error.message),
    });

    const deleteCost = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("operational_costs").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["operational-costs"] });
            toast.success("Custo removido.");
        },
    });

    return { costs, isLoading, addCost, deleteCost };
}
