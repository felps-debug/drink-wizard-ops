import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

export default function Escalas() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch upcoming events
    const { data: events, isLoading: eventsLoading } = useQuery({
        queryKey: ['upcoming_events'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            return data;
        }
    });

    // Fetch my confirmations
    const { data: myScales } = useQuery({
        queryKey: ['my_scales', user?.id],
        enabled: !!user,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('escalas')
                .select('event_id, status')
                .eq('user_id', user!.id);
            if (error) throw error;
            return data;
        }
    });

    // Toggle Availability
    const toggleAvailability = useMutation({
        mutationFn: async ({ eventId, currentStatus }: { eventId: string, currentStatus: boolean }) => {
            if (currentStatus) {
                // Remove confirmation
                await supabase
                    .from('escalas')
                    .delete()
                    .eq('event_id', eventId)
                    .eq('user_id', user!.id);
            } else {
                // Add confirmation
                await supabase
                    .from('escalas')
                    .insert({
                        event_id: eventId,
                        user_id: user!.id,
                        status: 'confirmado'
                    });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my_scales'] });
            toast.success("Disponibilidade atualizada!");
        },
        onError: (err: any) => {
            toast.error("Erro ao atualizar: " + err.message);
        }
    });

    const isConfirmed = (eventId: string) =>
        myScales?.some(s => s.event_id === eventId && s.status === 'confirmado');

    if (eventsLoading) return <AppLayout title="Escalas">Carregando...</AppLayout>;

    return (
        <AppLayout title="Escalas">
            <div className="space-y-6 p-4 md:p-8">
                <div className="flex flex-col gap-2">
                    <h1 className="font-display text-3xl font-bold uppercase text-white">Minhas Escalas</h1>
                    <p className="text-muted-foreground font-mono text-sm">Confirme sua disponibilidade para os próximos eventos.</p>
                </div>

                <div className="grid gap-4">
                    {events?.map((event: any) => (
                        <Card key={event.id} className={`group border-l-4 ${isConfirmed(event.id) ? 'border-l-primary' : 'border-l-transparent'} bg-black/40 border-white/10 hover:bg-white/5 transition-all`}>
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
                                        <Calendar className="w-4 h-4" />
                                        {format(new Date(event.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                    </div>
                                    <h3 className="font-display text-xl font-bold uppercase">{event.client_name || "Evento Privado"}</h3>
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Clock className="w-4 h-4" />
                                        {event.location || "Local a definir"}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => toggleAvailability.mutate({
                                        eventId: event.id,
                                        currentStatus: !!isConfirmed(event.id)
                                    })}
                                    variant={isConfirmed(event.id) ? "default" : "outline"}
                                    className={`h-12 px-6 uppercase font-bold tracking-wider ${isConfirmed(event.id)
                                        ? "bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                        : "border-white/20 hover:border-primary hover:text-primary"
                                        }`}
                                >
                                    {isConfirmed(event.id) ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" /> Confirmado
                                        </>
                                    ) : (
                                        "Confirmar"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    {events?.length === 0 && (
                        <div className="py-12 text-center border-2 border-dashed border-white/10">
                            <p className="text-muted-foreground font-mono uppercase">Nenhum evento futuro encontrado</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
