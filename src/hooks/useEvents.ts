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

      return data.map((event: any) => ({
        id: event.id,
        name: event.name || `Evento de ${event.client_name}`, // Fallback
        client_id: event.client_id,
        clientName: event.client_name,
        clientPhone: event.client_phone || '',
        location: event.location,
        date: event.date,
        contractValue: Number(event.contract_value || event.financial_value),
        status: event.status,
        createdAt: event.created_at,
        package_id: event.package_id,
        observations: event.observations,
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
      const { data, error } = await supabase
        .from('events')
        .insert([{
          name: newEvent.name,
          client_id: newEvent.client_id,
          client_name: newEvent.clientName,
          client_phone: newEvent.clientPhone,
          date: newEvent.date,
          location: newEvent.location,
          contract_value: newEvent.contractValue,
          status: newEvent.status,
          package_id: newEvent.package_id,
          observations: newEvent.observations
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
          name: event.name,
          client_id: event.client_id,
          client_name: event.clientName,
          client_phone: event.clientPhone,
          date: event.date,
          location: event.location,
          contract_value: event.contractValue,
          status: event.status,
          package_id: event.package_id,
          observations: event.observations
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

  // Update event status and fire automation (Moved from useEvent to apply globally)
  const updateEventStatus = useMutation({
    mutationFn: async ({ eventId, newStatus, triggerName }: {
      eventId: string;
      newStatus: string;
      triggerName?: string;
    }) => {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);

      if (error) throw error;

      // Fire automation if triggerName is provided
      if (triggerName) {
        const { data: eventData } = await supabase
          .from('events')
          .select('client_name, client_phone, date, location')
          .eq('id', eventId)
          .single();

        if (eventData) {
          supabase.functions.invoke('handle-automation', {
            body: {
              type: 'UPDATE',
              table: 'events',
              event_type: triggerName,
              record: {
                event_id: eventId,
                status: newStatus,
                client_name: eventData.client_name,
                client_phone: eventData.client_phone,
                event_date: eventData.date,
                event_location: eventData.location,
              },
            },
          }).catch((err) => console.error('[Automation] Trigger failed:', err));
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId] });
      toast.success('Status atualizado!');
    },
    onError: (err: any) => {
      toast.error('Erro ao atualizar status: ' + err.message);
    }
  });

  return {
    events: events || [],
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus
  };
};

export const useEvent = (id?: string) => {
  const queryClient = useQueryClient();

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
        name: data.name || `Evento de ${data.client_name}`,
        clientName: data.client_name,
        clientPhone: data.client_phone || '',
        location: data.location,
        date: data.date,
        contractValue: Number(data.contract_value || data.financial_value),
        status: data.status,
        createdAt: data.created_at,
        package_id: data.package_id,
        observations: data.observations,
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
        .from('checklists')
        .select('*')
        .eq('event_id', id);

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        eventId: item.event_id,
        type: item.type,
        items: item.items,
        status: item.status || 'pendente',
        checkedBy: item.checked_by
      }));
    },
    enabled: !!id
  });

  const saveChecklist = useMutation({
    mutationFn: async (data: { eventId: string; type: string; items: any[]; status: string }) => {
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;

      const { data: existing } = await supabase
        .from('checklists')
        .select('id')
        .eq('event_id', data.eventId)
        .eq('type', data.type)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('checklists')
          .update({
            items: data.items,
            status: data.status,
            checked_by: currentUserId,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('checklists')
          .insert({
            event_id: data.eventId,
            type: data.type,
            items: data.items,
            status: data.status,
            checked_by: currentUserId,
          });
        if (error) throw error;
      }

      // Auto-update event status when checklist is completed
      if (data.status === 'conferido') {
        const newStatus = data.type === 'entrada' ? 'em_curso' : 'finalizado';

        await supabase
          .from('events')
          .update({ status: newStatus })
          .eq('id', data.eventId);

        // Fetch event data to fire automation trigger
        const { data: eventData } = await supabase
          .from('events')
          .select('client_name, client_phone, date, location')
          .eq('id', data.eventId)
          .single();

        if (eventData) {
          // Fire handle-automation edge function with checklist trigger
          const triggerEvent = data.type === 'entrada'
            ? 'checklist_entrada'
            : 'checklist_saida';

          supabase.functions.invoke('handle-automation', {
            body: {
              type: 'UPDATE',
              table: 'checklists',
              event_type: data.type === 'entrada' ? 'entrada' : 'saida',
              record: {
                event_id: data.eventId,
                type: data.type,
                status: 'completed',
                client_name: eventData.client_name,
                client_phone: eventData.client_phone,
                event_date: eventData.date,
                event_location: eventData.location,
              },
            },
          }).catch((err) => console.error('[Automation] Trigger failed:', err));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', id] });
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
    saveChecklist,
  };
};
