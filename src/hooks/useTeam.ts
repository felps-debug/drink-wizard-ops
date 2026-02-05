import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/lib/mock-data";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  name: string;
  email?: string; // profile table might not strictly replicate auth email, but we often store it if needed
  role: UserRole;
  avatarUrl?: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export const useTeam = () => {
  const queryClient = useQueryClient();

  // 1. Fetch Active Team Members (Profiles)
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['team_members'],
    queryFn: async () => {
      // Note: "profiles" usually doesn't store email by default in some setups 
      // unless we synced it from auth.users.
      // Assuming our trigger or signup flow adds 'full_name' and maybe we can't get email directly 
      // from profiles easily without a joined view or if we saved it in metadata.
      // For now, let's fetch what we have in profiles.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;

      return data.map((p: any) => ({
        id: p.id,
        name: p.full_name || 'Sem nome',
        role: p.role,
        avatarUrl: p.avatar_url
      })) as TeamMember[];
    }
  });

  // 2. Fetch Pending Invites
  const { data: invites, isLoading: loadingInvites } = useQuery({
    queryKey: ['team_invites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((i: any) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        createdAt: i.created_at
      })) as TeamInvite[];
    }
  });

  // 3. Invite Member Action
  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string, role: UserRole }) => {
      const { error } = await supabase
        .from('team_invites')
        .insert({ email, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_invites'] });
      toast.success("Convite enviado com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao enviar convite: " + err.message);
    }
  });

  // 4. Delete/Revoke Invite
  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_invites')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_invites'] });
      toast.success("Convite removido.");
    },
    onError: (err: any) => {
      toast.error("Erro ao remover convite: " + err.message);
    }
  });

  return {
    members: members || [],
    invites: invites || [],
    isLoading: loadingMembers || loadingInvites,
    inviteMember,
    revokeInvite
  };
};
