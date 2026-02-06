import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type StaffRole = 'bartender' | 'chefe_bar' | 'montador';

export interface Staff {
    id: string;
    name: string;
    phone: string;
    role: StaffRole;
    roles: StaffRole[];
    daily_rate: number;
    notes?: string;
    active: boolean;
    created_at: string;
}

export function useStaff() {
    const queryClient = useQueryClient();

    // Fetch all staff
    const { data: staff = [], isLoading } = useQuery({
        queryKey: ['magodosdrinks_staff'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('magodosdrinks_staff')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            return data as Staff[];
        }
    });

    // Add new staff
    const addStaff = useMutation({
        mutationFn: async (newStaff: Omit<Staff, 'id' | 'created_at' | 'active'>) => {
            const { data, error } = await supabase
                .from('magodosdrinks_staff')
                .insert({ ...newStaff, active: true })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_staff'] });
            toast.success('Profissional cadastrado!');
        },
        onError: (err: any) => {
            toast.error('Erro ao cadastrar: ' + err.message);
        }
    });

    // Update staff
    const updateStaff = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Staff> & { id: string }) => {
            const { error } = await supabase
                .from('magodosdrinks_staff')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_staff'] });
            toast.success('Profissional atualizado!');
        },
        onError: (err: any) => {
            toast.error('Erro ao atualizar: ' + err.message);
        }
    });

    // Deactivate staff (soft delete)
    const removeStaff = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('magodosdrinks_staff')
                .update({ active: false })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_staff'] });
            toast.success('Profissional removido!');
        },
        onError: (err: any) => {
            toast.error('Erro ao remover: ' + err.message);
        }
    });

    return {
        staff,
        isLoading,
        addStaff,
        updateStaff,
        removeStaff
    };
}

// Helper to get role label
export function getStaffRoleLabel(role: StaffRole): string {
    const labels: Record<StaffRole, string> = {
        bartender: 'Bartender',
        chefe_bar: 'Chefe de Bar',
        montador: 'Montador'
    };
    return labels[role] || role;
}
