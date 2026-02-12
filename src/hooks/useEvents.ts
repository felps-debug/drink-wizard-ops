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
        .order('created_at', { ascending: false });

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
          const toastId = toast.loading("Atualizando status e notificando...");

          try {
            const automationRes = await supabase.functions.invoke('handle-automation', {
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
            });

            const results = automationRes.data;
            const hasSuccess = Array.isArray(results) && results.some((r: any) => r.status === 'success' || r.status === 'test');
            const hasError = Array.isArray(results) && results.some((r: any) => r.status === 'error');

            toast.dismiss(toastId);

            if (automationRes.error || (hasError && !hasSuccess)) {
              console.error('[Automation] Trigger failed:', automationRes.error || results);
              const reason = Array.isArray(results) ? results.find((r: any) => r.status === 'error')?.reason : 'Erro desconhecido';
              toast.error(`Status salvo, mas erro ao notificar: ${reason}`);
            } else if (hasSuccess) {
              toast.success("Status atualizado e cliente notificado!");
            }
          } catch (err) {
            console.error('[Automation] Network error:', err);
            toast.dismiss(toastId);
            toast.error("Status salvo, mas falha na conexão da notificação");
          }
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

      console.log('useEvent: saveChecklist called', { type: data.type, status: data.status });

      // Auto-update event status when checklist is completed
      if (data.status === 'conferido') {
        const newStatus = data.type === 'entrada' ? 'em_curso' : 'finalizado';
        console.log('useEvent: Updating event status to', newStatus);

        await supabase
          .from('events')
          .update({ status: newStatus })
          .eq('id', data.eventId);

        // Fetch event data to fire automation trigger
        const { data: eventData } = await supabase
          .from('events')
          .select('client_name, client_phone, date, location, name, client_id')
          .eq('id', data.eventId)
          .single();

        console.log('useEvent: Fetched event data for automation', eventData);

        if (eventData) {
          // Fire handle-automation edge function with checklist trigger
          const triggerEvent = data.type === 'entrada'
            ? 'checklist_entrada'
            : 'checklist_saida';

          const targetPhone = eventData.client_phone || "(Sem telefone no evento)";

          // DEBUG: Persistent toast
          const toastId = toast.loading(`Iniciando notificação para: ${targetPhone}`, {
            duration: Infinity, // User must dismiss
            action: {
              label: 'Fechar',
              onClick: () => console.log('Toast dismissed')
            }
          });

          try {
            console.log('useEvent: Invoking handle-automation (Awaiting)', {
              triggerEvent,
              client_phone: eventData.client_phone,
              client_id: eventData.client_id
            });

            // Double check validation
            if (!eventData.client_phone && !eventData.client_id) {
              throw new Error("ALERTA CRÍTICO: Evento sem telefone e sem Vínculo de Cliente!");
            }

            const automationRes = await supabase.functions.invoke('handle-automation', {
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
                  client_id: eventData.client_id,
                  event_date: eventData.date,
                  event_location: eventData.location,
                  event_name: eventData.name,
                },
              },
            });

            const results = automationRes.data;
            const hasSuccess = Array.isArray(results) && results.some((r: any) => r.status === 'success' || r.status === 'test');
            const hasError = Array.isArray(results) && results.some((r: any) => r.status === 'error');

            toast.dismiss(toastId);

            if (automationRes.error || (hasError && !hasSuccess)) {
              console.error('[Automation] Supabase invoke error:', automationRes.error || results);

              let reason = 'Falha desconhecida';

              // Case 1: Supabase/Network Error
              if (automationRes.error) {
                reason = automationRes.error.message || JSON.stringify(automationRes.error);
              }
              // Case 2: Logic Error in Results Array
              else if (Array.isArray(results)) {
                const errorItem = results.find((r: any) => r.status === 'error');
                reason = errorItem?.reason || errorItem?.message || JSON.stringify(errorItem);
              }
              // Case 3: Result is an object (500 response handled manually)
              else if (results && typeof results === 'object') {
                reason = (results as any).message || (results as any).error || JSON.stringify(results);
              }

              const errorMsg = reason?.includes('phone number')
                ? `ERRO: Cliente sem telefone cadastrado! (ID: ${eventData.client_id || 'N/A'})`
                : `ERRO TÉCNICO: ${reason}`;

              toast.error(errorMsg, { duration: 10000 });
            } else if (hasSuccess) {
              console.log('useEvent: Automation success', results);
              toast.success(`SUCESSO: Notificação enviada para ${targetPhone}!`, { duration: 5000 });
            } else {
              console.log('useEvent: No automation executed', results);
              toast.warning("ALERTA: Nenhuma automação configurada foi encontrada.", { duration: 10000 });
            }
          } catch (autoErr) {
            toast.dismiss(toastId);
            console.error('[Automation] Trigger failed:', autoErr);
            const errorText = autoErr instanceof Error ? autoErr.message : 'Erro de rede ou desconhecido';
            toast.error(`FALHA CRÍTICA: ${errorText}`, { duration: 10000 });
            // window.alert(`FALHA CRÍTICA NA NOTIFICAÇÃO: ${errorText}`);
          }
        } else {
          console.warn('useEvent: Event data not found for automation');
          throw new Error("Dados do evento não encontrados. Automação falhou.");
        }
      } else {
        console.log('useEvent: Status is not conferido, skipping automation', data.status);
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

export const useStaffEvents = (staffId?: string) => {
  return useQuery({
    queryKey: ['staff_events', staffId],
    enabled: !!staffId,
    queryFn: async () => {
      // Fetch events where the staff is allocated
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          magodosdrinks_allocations!inner(staff_id)
        `)
        .eq('magodosdrinks_allocations.staff_id', staffId)
        .order('date', { ascending: true });

      if (error) throw error;

      return data.map((event: any) => ({
        id: event.id,
        name: event.name || `Evento de ${event.client_name}`,
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
};
