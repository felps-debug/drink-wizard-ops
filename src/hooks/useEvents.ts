import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Evento } from "@/lib/mock-data";
import { toast } from "sonner";

export const useEvents = () => {
  const queryClient = useQueryClient();

  // Fetch events
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      // Map database fields to frontend types if necessary
      // Assuming 1:1 mapping for simplicity based on the schema plan, 
      // but might need adapting snake_case to camelCase if we strictly follow interfaces
      return data.map((event: any) => ({
        id: event.id,
        clientName: event.client_name,
        clientPhone: event.client_phone || '', // Check DB schema compliance
        location: event.location,
        date: event.date,
        contractValue: Number(event.financial_value), // Access controlled by RLS
        status: event.status,
        createdAt: event.created_at,
      })) as Evento[];
    }
  });

  // Delete event
  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success("Evento removido com sucesso");
    },
    onError: (err: any) => {
      toast.error("Erro ao remover evento: " + err.message);
    }
  });


  // Add event
  const addEvent = useMutation({
    mutationFn: async (newEvent: Omit<Evento, 'id' | 'createdAt'>) => {
      // Map frontend type to DB schema (snake_case)
      const { data, error } = await supabase
        .from('events')
        .insert([{
          client_name: newEvent.clientName,
          client_phone: newEvent.clientPhone,
          date: newEvent.date,
          location: newEvent.location,
          financial_value: newEvent.contractValue,
          status: newEvent.status
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success("Evento criado com sucesso");
    },
    onError: (err: any) => {
      toast.error("Erro ao criar evento: " + err.message);
    }
  });

  // Update event
  const updateEvent = useMutation({
    mutationFn: async (event: Evento) => {
      const { error } = await supabase
        .from('events')
        .update({
          client_name: event.clientName,
          client_phone: event.clientPhone,
          date: event.date,
          location: event.location,
          financial_value: event.contractValue,
          status: event.status
        })
        .eq('id', event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success("Evento atualizado com sucesso");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar evento: " + err.message);
    }
  });

  return {
    events: events || [],
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent
  };
};

export const useEvent = (id?: string) => {
  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        clientName: data.client_name,
        clientPhone: data.client_phone || '',
        location: data.location,
        date: data.date,
        contractValue: Number(data.financial_value),
        status: data.status,
        createdAt: data.created_at,
      } as Evento;
    },
    enabled: !!id
  });


  // Fetch checklists for this event
  const { data: checklists, isLoading: isLoadingChecklists } = useQuery({
    queryKey: ['checklists', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('event_checklists') // Table name from schema
        .select('*')
        .eq('event_id', id);

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        eventId: item.event_id,
        type: item.type, // 'entrada' | 'saida'
        items: item.items, // JSONB content
        status: item.status || 'pendente', // Assuming status field exists or derived
        checkedBy: item.checked_by
      }));
    },
    enabled: !!id
  });

  const queryClient = useQueryClient();

  const saveChecklist = useMutation({
    mutationFn: async (data: { eventId: string; type: string; items: any[]; status: string }) => {
      // Check if checklist exists
      const { data: existing } = await supabase
        .from('event_checklists')
        .select('id')
        .eq('event_id', data.eventId)
        .eq('type', data.type)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('event_checklists')
          .update({
            items: data.items,
            status: data.status,
            checked_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_checklists')
          .insert({
            event_id: data.eventId,
            type: data.type,
            items: data.items,
            status: data.status,
            checked_by: (await supabase.auth.getUser()).data.user?.id
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', id] });
      toast.success("Checklist salvo com sucesso");
    },
    onError: (err: any) => {
      toast.error("Erro ao salvar checklist: " + err.message);
    }
  });

  return {
    event,
    checklists: checklists || [],
    isLoading: isLoadingEvent || isLoadingChecklists,
    saveChecklist
  };
};
