import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client } from "@/lib/mock-data";
import { toast } from "sonner";

export function useClients() {
    const queryClient = useQueryClient();

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) {
                // Se a tabela não existir ainda, retorna array vazio para não quebrar a UI
                console.warn("Erro ao buscar clientes (tabela existe?):", error);
                return [];
            }
            return data as Client[];
        }
    });

    const addClient = useMutation({
        mutationFn: async (client: Omit<Client, 'id' | 'active'>) => {
            const { data, error } = await supabase
                .from('clients')
                .insert([{ ...client, active: true }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success("Cliente cadastrado com sucesso!");
        },
        onError: (err: any) => {
            toast.error("Erro ao cadastrar cliente: " + err.message);
        }
    });

    const updateClient = useMutation({
        mutationFn: async (client: Client) => {
            const { error } = await supabase
                .from('clients')
                .update({
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    cpf_cnpj: client.cpf_cnpj,
                    notes: client.notes
                })
                .eq('id', client.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success("Cliente atualizado!");
        },
        onError: (err: any) => {
            toast.error("Erro ao atualizar: " + err.message);
        }
    });

    const deleteClient = useMutation({
        mutationFn: async (id: string) => {
            // Soft delete
            const { error } = await supabase
                .from('clients')
                .update({ active: false })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success("Cliente removido!");
        },
        onError: (err: any) => {
            toast.error("Erro ao remover: " + err.message);
        }
    });

    return {
        clients,
        isLoading,
        addClient,
        updateClient,
        mutateAsync: deleteClient.mutateAsync, // Export directly or use the object
        deleteClient // Export correctly
    };
}
