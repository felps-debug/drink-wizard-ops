import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface WhatsappInstance {
    id: string;
    user_id: string;
    name: string;
    instance_id: string;
    instance_token: string;
    status: string;
    created_at: string;
}

export function useWhatsappInstance() {
    const queryClient = useQueryClient();

    // Fetch the current user's instance
    const { data: instance, isLoading } = useQuery({
        queryKey: ['magodosdrinks_whatsapp_instance'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('magodosdrinks_whatsapp_instances')
                .select('*')
                .maybeSingle();

            if (error) throw error;
            return data as WhatsappInstance | null;
        }
    });

    // Create a new instance
    const createInstance = useMutation({
        mutationFn: async (name: string) => {
            const { data: session } = await supabase.auth.getSession();
            const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
                body: { action: 'init', name },
                headers: {
                    Authorization: `Bearer ${session.session?.access_token}`
                }
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_whatsapp_instance'] });
            toast.success('Instância criada! Agora gere o QR Code.');
        },
        onError: async (err: any) => {
            console.error('Erro detalhado:', err);
            let message = err.message;
            if (err.context) {
                try {
                    const body = await err.context.json();
                    if (body.error) message = `${body.error}: ${JSON.stringify(body.details || '')}`;
                } catch (e) {
                    // Ignore parsing error
                }
            }
            toast.error('Erro ao criar instância: ' + message);
        }
    });

    // Connect (Get QR Code)
    const connectInstance = useMutation({
        mutationFn: async (instanceToken: string) => {
            const { data: session } = await supabase.auth.getSession();
            const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
                body: { action: 'connect', instanceToken },
                headers: {
                    Authorization: `Bearer ${session.session?.access_token}`
                }
            });
            if (error) throw error;
            return data; // Usually contains qrcode or paircode
        }
    });

    // Status Polling
    const checkStatus = useMutation({
        mutationFn: async (params: { instanceId: string, instanceToken: string }) => {
            const { data: session } = await supabase.auth.getSession();
            const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
                body: { action: 'status', ...params },
                headers: {
                    Authorization: `Bearer ${session.session?.access_token}`
                }
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            if (data.instance?.status === 'connected') {
                queryClient.invalidateQueries({ queryKey: ['magodosdrinks_whatsapp_instance'] });
            }
        }
    });

    // Delete/Logout
    const disconnectInstance = useMutation({
        mutationFn: async (params: { instanceId: string, instanceToken: string }) => {
            const { data: session } = await supabase.auth.getSession();
            const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
                body: { action: 'delete', ...params },
                headers: {
                    Authorization: `Bearer ${session.session?.access_token}`
                }
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_whatsapp_instance'] });
            toast.success('WhatsApp desconectado.');
        }
    });

    return {
        instance,
        isLoading,
        createInstance,
        connectInstance,
        checkStatus,
        disconnectInstance
    };
}
