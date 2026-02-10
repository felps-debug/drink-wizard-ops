import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { whatsappService } from '@/services/whatsapp';

export interface Allocation {
    id: string;
    event_id: string;
    staff_id: string;
    daily_rate: number;
    status: 'reservado' | 'confirmado' | 'cancelado';
    whatsapp_sent: boolean;
    created_at: string;
    // Joined data
    staff?: {
        id: string;
        name: string;
        phone: string;
        role: string;
    };
}

export function useAllocations(eventId?: string) {
    const queryClient = useQueryClient();

    // Fetch allocations for an event
    const { data: allocations = [], isLoading } = useQuery({
        queryKey: ['magodosdrinks_allocations', eventId],
        enabled: !!eventId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('magodosdrinks_allocations')
                .select(`
          *,
          staff:magodosdrinks_staff(id, name, phone, role)
        `)
                .eq('event_id', eventId)
                .neq('status', 'cancelado');

            if (error) throw error;
            return data as Allocation[];
        }
    });

    // Add staff to event and auto-notify via WhatsApp
    const allocateStaff = useMutation({
        mutationFn: async ({ staffId, dailyRate }: { staffId: string; dailyRate: number }) => {
            if (!eventId) throw new Error('Event ID required');

            // 1. Insert allocation
            const { data, error } = await supabase
                .from('magodosdrinks_allocations')
                .insert({
                    event_id: eventId,
                    staff_id: staffId,
                    daily_rate: dailyRate,
                    status: 'confirmado',
                    whatsapp_sent: false
                })
                .select(`
                    *,
                    staff:magodosdrinks_staff(id, name, phone, role)
                `)
                .single();

            if (error) throw error;

            // 2. Fetch event details for the notification message
            const { data: eventData } = await supabase
                .from('events')
                .select('client_name, date, location')
                .eq('id', eventId)
                .single();

            const staffPhone = data.staff?.phone;
            const staffName = data.staff?.name || 'Profissional';

            if (staffPhone && eventData) {
                const formattedDate = new Date(eventData.date).toLocaleDateString('pt-BR');
                const message = `🎉 Olá ${staffName}! Você foi escalado para o evento:\n\n` +
                    `📋 Cliente: ${eventData.client_name}\n` +
                    `📅 Data: ${formattedDate}\n` +
                    `📍 Local: ${eventData.location}\n\n` +
                    `Confirme sua presença respondendo esta mensagem!`;

                try {
                    await whatsappService.sendMessage(staffPhone, message);
                    // Mark as sent
                    await supabase
                        .from('magodosdrinks_allocations')
                        .update({ whatsapp_sent: true })
                        .eq('id', data.id);
                } catch (whatsappErr) {
                    console.error('[Allocation] WhatsApp failed:', whatsappErr);
                    // Don't throw — allocation still succeeds even if WhatsApp fails
                }
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_allocations', eventId] });
            toast.success('Profissional alocado e notificado! 📱');
        },
        onError: (err: any) => {
            if (err.message.includes('duplicate')) {
                toast.error('Profissional já está alocado para este evento');
            } else {
                toast.error('Erro ao alocar: ' + err.message);
            }
        }
    });

    // Confirm allocation and send WhatsApp
    const confirmAndNotify = useMutation({
        mutationFn: async ({
            allocationId,
            staffName,
            staffPhone,
            eventName,
            eventDate,
            eventLocation
        }: {
            allocationId: string;
            staffName: string;
            staffPhone: string;
            eventName: string;
            eventDate: string;
            eventLocation: string;
        }) => {
            // 1. Fetch template from referencial
            const { data: refData } = await supabase
                .from('magodosdrinks_referencial')
                .select('valor')
                .eq('categoria', 'mensagem')
                .eq('chave', 'convite')
                .single();

            const template = refData?.valor || 'Opa, você foi escolhido {nome}! 🎉';

            // 2. Prepare message
            const message = template
                .replace('{nome}', staffName)
                .replace('{cliente}', eventName)
                .replace('{data}', eventDate)
                .replace('{local}', eventLocation);

            // 3. Send WhatsApp
            const result = await whatsappService.sendMessage(staffPhone, message);

            if (result.status === 'error') {
                throw new Error(result.error || 'Falha ao enviar WhatsApp');
            }

            // 4. Update status in DB
            const { error } = await supabase
                .from('magodosdrinks_allocations')
                .update({
                    status: 'confirmado',
                    whatsapp_sent: true
                })
                .eq('id', allocationId);

            if (error) throw error;

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_allocations', eventId] });
            toast.success('Confirmado e WhatsApp enviado! 📱');
        },
        onError: (err: any) => {
            toast.error('Erro: ' + err.message);
        }
    });

    // Remove allocation
    const removeAllocation = useMutation({
        mutationFn: async (allocationId: string) => {
            const { error } = await supabase
                .from('magodosdrinks_allocations')
                .update({ status: 'cancelado' })
                .eq('id', allocationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_allocations', eventId] });
            toast.success('Alocação removida!');
        },
        onError: (err: any) => {
            toast.error('Erro ao remover: ' + err.message);
        }
    });

    return {
        allocations,
        isLoading,
        allocateStaff,
        confirmAndNotify,
        removeAllocation
    };
}
