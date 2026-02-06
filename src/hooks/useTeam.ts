import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/lib/mock-data";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('nome');

      if (error) throw error;

      return data.map((p: any) => ({
        id: p.id,
        name: p.nome || 'Sem nome',
        role: p.cargo || 'bartender',
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
        role: i.cargo || i.role,
        createdAt: i.created_at
      })) as TeamInvite[];
    }
  });

  // 3. Invite Member Action
  const inviteMember = useMutation({
    mutationFn: async ({ email, role, name }: { email: string, role: UserRole, name: string }) => {
      const { data, error } = await supabase.functions.invoke('invite-agent', {
        body: { email, role, full_name: name }
      });

      if (error) throw error;

      // Also record in team_invites for visibility in the list
      await supabase.from('team_invites').insert({ email, role: role });
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
