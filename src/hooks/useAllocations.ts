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
                .upsert({
                    event_id: eventId,
                    staff_id: staffId,
                    daily_rate: dailyRate,
                    status: 'confirmado',
                    whatsapp_sent: false
                }, { onConflict: 'event_id, staff_id' })
                .select(`
                    *,
                    staff:magodosdrinks_staff(id, name, phone, role)
                `)
                .single();

            if (error) throw error;

            // 2. Fetch event details for the notification message
            const { data: eventData } = await supabase
                .from('events')
                .select('client_name, date, location, name')
                .eq('id', eventId)
                .single();

            const staffPhone = data.staff?.phone;
            const staffName = data.staff?.name || 'Profissional';
            const staffRole = data.staff?.role; // Need to ensure role is selected in upsert query above

            // Helper to normalize phone
            const normalizePhone = (phone: string) => {
                const cleaned = phone.replace(/\D/g, '');
                // Case 1: 8 or 9 digits (Local number without DD) -> Assume 11 (SP)
                if (cleaned.length === 8 || cleaned.length === 9) return `5511${cleaned}`;
                // Case 2: 10 or 11 digits (Number with DD) -> Add 55
                if (cleaned.length === 10 || cleaned.length === 11) return `55${cleaned}`;
                // Case 3: Already has country code
                return cleaned;
            };

            // ONLY NOTIFY BARTENDERS
            // Note: The role in DB is 'bartender', UI label is 'Barman'
            if (staffPhone && eventData && staffRole === 'bartender') {
                const formattedDate = new Date(eventData.date).toLocaleDateString('pt-BR');
                const eventName = eventData.name || `Evento de ${eventData.client_name}`;
                const targetPhone = normalizePhone(staffPhone);

                console.log(`[Allocation] Attempting to notify ${staffName} (${targetPhone})`);

                const message = `🎉 Olá ${staffName}! Você foi escalado para o evento:\n\n` +
                    `🍸 *${eventName}*\n` +
                    `📋 Cliente: ${eventData.client_name}\n` +
                    `📅 Data: ${formattedDate}\n` +
                    `📍 Local: ${eventData.location}\n\n` +
                    `Confirme sua presença respondendo esta mensagem!`;

                try {
                    const result = await whatsappService.sendMessage(targetPhone, message);
                    if (result.status === 'success') {
                        toast.success(`Notificação enviada para ${staffName}! 📱`);
                        // Mark as sent
                        await supabase
                            .from('magodosdrinks_allocations')
                            .update({ whatsapp_sent: true })
                            .eq('id', data.id);
                    } else {
                        console.warn('[Allocation] WhatsApp service returned error:', result.error);
                        // toast.warning(`Erro ao notificar WhatsApp: ${result.error}`);
                    }

                } catch (whatsappErr) {
                    console.error('[Allocation] WhatsApp failed:', whatsappErr);
                }
            } else {
                console.log(`[Allocation] Skipping WhatsApp. Role: ${staffRole}, Phone: ${staffPhone}`);
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
            staffRole,
            eventName,
            eventDate,
            eventLocation
        }: {
            allocationId: string;
            staffName: string;
            staffPhone: string;
            staffRole: string; // Added role
            eventName: string;
            eventDate: string;
            eventLocation: string;
        }) => {
            // ONLY NOTIFY BARTENDERS
            if (staffRole !== 'bartender') {
                // Just update status, no WhatsApp
                const { error } = await supabase
                    .from('magodosdrinks_allocations')
                    .update({ status: 'confirmado' })
                    .eq('id', allocationId);

                if (error) throw error;
                return { status: 'skipped', message: 'Notificação ignorada para função não-bartender' };
            }

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

            // Helper (duplicated for now, could move to utils)
            const normalizePhone = (phone: string) => {
                const cleaned = phone.replace(/\D/g, '');
                if (cleaned.length === 8 || cleaned.length === 9) return `5511${cleaned}`;
                if (cleaned.length === 10 || cleaned.length === 11) return `55${cleaned}`;
                return cleaned;
            };

            const targetPhone = normalizePhone(staffPhone);

            // 3. Send WhatsApp
            const result = await whatsappService.sendMessage(targetPhone, message);

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
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_allocations', eventId] });
            toast.success(`Confirmado! WhatsApp enviado para ${variables.staffPhone} 📱`);
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

export function useBusyStaff(date: string) {
    return useQuery({
        queryKey: ['busy_staff', date],
        enabled: !!date,
        queryFn: async () => {
            // 1. Get all events on this date
            const { data: events } = await supabase
                .from('events')
                .select('id')
                .eq('date', date);

            if (!events || events.length === 0) return [];

            const eventIds = events.map(e => e.id);

            // 2. Get allocations for these events
            const { data: allocations } = await supabase
                .from('magodosdrinks_allocations')
                .select('staff_id')
                .in('event_id', eventIds)
                .neq('status', 'cancelado');

            if (!allocations) return [];

            // Return array of distinct staff IDs
            return [...new Set(allocations.map(a => a.staff_id))];
        }
    });
}
