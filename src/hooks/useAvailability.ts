import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface AvailabilityRecord {
    id: string;
    user_id: string;
    available_date: string;
    created_at: string;
}

export function useAvailability(userId?: string) {
    const queryClient = useQueryClient();

    // Fetch availability for a specific user (bartender view)
    const { data: myAvailability = [], isLoading: isLoadingMy } = useQuery({
        queryKey: ["staff_availability", userId],
        enabled: !!userId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("staff_availability")
                .select("*")
                .eq("user_id", userId!)
                .order("available_date", { ascending: true });

            if (error) throw error;
            return data as AvailabilityRecord[];
        },
    });

    // Fetch ALL availability for a specific date (admin view)
    const useAvailableOnDate = (date: string) =>
        useQuery({
            queryKey: ["staff_availability_date", date],
            enabled: !!date,
            queryFn: async () => {
                const { data, error } = await supabase
                    .from("staff_availability")
                    .select(`*, profiles:user_id(id, nome, cargo, telefone)`)
                    .eq("available_date", date);

                if (error) throw error;
                return data;
            },
        });

    // Toggle a date (add/remove)
    const toggleDate = useMutation({
        mutationFn: async (date: string) => {
            if (!userId) throw new Error("User ID required");

            const existing = myAvailability.find(
                (a) => a.available_date === date
            );

            if (existing) {
                const { error } = await supabase
                    .from("staff_availability")
                    .delete()
                    .eq("id", existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("staff_availability")
                    .insert({ user_id: userId, available_date: date });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["staff_availability", userId],
            });
            toast.success("Disponibilidade atualizada!");
        },
        onError: (err: Error) => {
            toast.error("Erro: " + err.message);
        },
    });

    const isDateAvailable = (date: string) =>
        myAvailability.some((a) => a.available_date === date);

    return {
        myAvailability,
        isLoadingMy,
        toggleDate,
        isDateAvailable,
        useAvailableOnDate,
    };
}
