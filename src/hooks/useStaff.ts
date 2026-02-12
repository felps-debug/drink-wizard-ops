import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type StaffRole = 'bartender' | 'chefe_bar' | 'montador';

export interface Staff {
    id: string;
    name: string;
    phone: string;
    email?: string; // New field
    status: 'active' | 'pending'; // New field
    role: StaffRole;
    daily_rate: number;
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
                .order('name');

            if (error) throw error;
            return data as Staff[];
        }
    });

    // Add new staff
    const addStaff = useMutation({
        mutationFn: async (newStaff: Omit<Staff, 'id' | 'created_at'>) => {
            const { data, error } = await supabase
                .from('magodosdrinks_staff')
                .insert(newStaff)
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

    // Delete staff
    const removeStaff = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('magodosdrinks_staff')
                .delete()
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

export function useMyInvites(userEmail?: string) {
    const queryClient = useQueryClient();

    const { data: invites = [], isLoading } = useQuery({
        queryKey: ['my_staff_invites', userEmail],
        enabled: !!userEmail,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('magodosdrinks_staff')
                .select('*')
                .eq('email', userEmail)
                .eq('status', 'pending');

            if (error) throw error;
            return data as Staff[];
        }
    });

    const acceptInvite = useMutation({
        mutationFn: async ({ staffId, userId, role }: { staffId: string; userId: string; role: StaffRole }) => {
            // 1. Update Staff Record
            const { error: staffError } = await supabase
                .from('magodosdrinks_staff')
                .update({
                    status: 'active',
                    user_id: userId
                })
                .eq('id', staffId);

            if (staffError) throw staffError;

            // 2. Update Profile Role (Permissions)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    cargo: role
                })
                .eq('id', userId);

            if (profileError) {
                console.error("Failed to sync profile role", profileError);
                // Don't throw, staff update is more important for allocation
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my_staff_invites'] });
            queryClient.invalidateQueries({ queryKey: ['magodosdrinks_staff'] }); // If user sees this
            toast.success("Convite aceito! Seu perfil foi atualizado.");
            setTimeout(() => window.location.reload(), 1500); // Reload to refresh permissions/views
        },
        onError: (err: any) => {
            toast.error("Erro ao aceitar: " + err.message);
        }
    });

    return {
        invites,
        isLoading,
        acceptInvite
    };
}

// Helper to get role label
export function getStaffRoleLabel(role: StaffRole): string {
    const labels: Record<StaffRole, string> = {
        bartender: 'Barman',
        chefe_bar: 'Chefe de Bar',
        montador: 'Montador'
    };
    return labels[role] || role;
}
