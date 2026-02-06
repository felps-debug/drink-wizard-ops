import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { whatsappService } from '@/services/whatsapp';

export interface Assignment {
    id: string;
    event_id: string;
    user_id: string;
    rate: number;
    status: 'pending' | 'confirmed' | 'declined';
    profiles: {
        full_name: string;
        phone: string;
        role: string;
    };
}

export function useAssignments(eventId?: string) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (eventId) {
            fetchAssignments();
        }
    }, [eventId]);

    async function fetchAssignments() {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('magodosdrinks_assignments') // Using the new table
                .select(`
          *,
          profiles (
            full_name,
            phone,
            role
          )
        `)
                .eq('event_id', eventId);

            if (error) throw error;
            setAssignments(data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Erro ao carregar escala.');
        } finally {
            setIsLoading(false);
        }
    }

    async function addAssignment(userId: string, rate: number) {
        try {
            const { data, error } = await supabase
                .from('magodosdrinks_assignments')
                .insert([{
                    event_id: eventId,
                    user_id: userId,
                    rate: rate,
                    status: 'pending'
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success('Profissional adicionado à escala!');
            fetchAssignments();
            return data;
        } catch (error) {
            console.error('Error adding assignment:', error);
            toast.error('Erro ao adicionar profissional.');
        }
    }

    async function removeAssignment(id: string) {
        try {
            const { error } = await supabase
                .from('magodosdrinks_assignments')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Profissional removido.');
            fetchAssignments();
        } catch (error) {
            console.error('Error removing assignment:', error);
            toast.error('Erro ao remover profissional.');
        }
    }

    async function confirmAndNotify(assignment: Assignment, eventDate: string, eventName: string) {
        try {
            // 1. Update status in DB
            const { error } = await supabase
                .from('magodosdrinks_assignments')
                .update({ status: 'confirmed' })
                .eq('id', assignment.id);

            if (error) throw error;

            // 2. Send WhatsApp
            if (assignment.profiles.phone) {
                const message = `Olá ${assignment.profiles.full_name}! 🍹\n\nVocê foi escalado para o evento *${eventName}*.\n📅 Data: ${eventDate}\n💰 Diária: R$ ${assignment.rate.toFixed(2)}\n\nPor favor, confirme sua presença!`;
                await whatsappService.sendMessage(assignment.profiles.phone, message);
                toast.success(`Notificação enviada para ${assignment.profiles.full_name}`);
            } else {
                toast.warning('Profissional sem telefone cadastrado.');
            }

            fetchAssignments();
        } catch (error) {
            console.error('Error confirming assignment:', error);
            toast.error('Erro ao confirmar escala.');
        }
    }

    return {
        assignments,
        isLoading,
        addAssignment,
        removeAssignment,
        confirmAndNotify
    };
}
