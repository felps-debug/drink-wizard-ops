import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAvailability } from "@/hooks/useAvailability";
import { useAllocations } from "@/hooks/useAllocations";
import { useStaff } from "@/hooks/useStaff";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isToday,
    getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    UserPlus,
    CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

// ─── BARTENDER VIEW: Monthly Calendar to Mark Available Days ────────────────
function BartenderAvailabilityView() {
    const { user } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { myAvailability, isLoadingMy, toggleDate, isDateAvailable } =
        useAvailability(user?.id);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart);

    return (
        <div className="space-y-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Minha Disponibilidade
                </h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-none border-white/20 h-8 w-8"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-bold uppercase text-sm min-w-[140px] text-center font-mono">
                        {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-none border-white/20 h-8 w-8"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                Clique nos dias em que você está{" "}
                <span className="text-primary font-bold">disponível</span> para
                trabalhar
            </p>

            {isLoadingMy ? (
                <div className="text-center text-muted-foreground py-12 font-mono uppercase">
                    Carregando...
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-1">
                    {/* Weekday Headers */}
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                        <div
                            key={d}
                            className="text-center text-[10px] font-bold uppercase text-muted-foreground py-2 font-mono"
                        >
                            {d}
                        </div>
                    ))}

                    {/* Padding */}
                    {Array.from({ length: startPadding }).map((_, i) => (
                        <div key={`pad-${i}`} />
                    ))}

                    {/* Days */}
                    {days.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const available = isDateAvailable(dateStr);
                        const past =
                            day < new Date(new Date().setHours(0, 0, 0, 0));

                        return (
                            <button
                                key={dateStr}
                                disabled={past || toggleDate.isPending}
                                onClick={() => toggleDate.mutate(dateStr)}
                                className={`
                  aspect-square flex flex-col items-center justify-center border transition-all text-sm font-bold
                  ${past ? "opacity-30 cursor-not-allowed" : ""}
                  ${available
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "border-white/10 hover:border-white/30 text-white/60"
                                    }
                  ${isToday(day) ? "ring-1 ring-yellow-400" : ""}
                `}
                            >
                                {format(day, "d")}
                                {available && <Check className="w-2.5 h-2.5 mt-0.5" />}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs uppercase tracking-wide text-muted-foreground font-mono">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-primary/20 border border-primary" />
                    Disponível ({myAvailability.length} dias)
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-white/10" />
                    Indisponível
                </div>
            </div>
        </div>
    );
}

// ─── ADMIN VIEW: Pick Event → See Available Staff → Allocate ────────────────
function AdminSchedulingView() {
    const { staff = [] } = useStaff();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Fetch upcoming events
    const { data: events = [] } = useQuery({
        queryKey: ["upcoming_events_admin"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .gte("date", new Date().toISOString())
                .order("date", { ascending: true });
            if (error) throw error;
            return data;
        },
    });

    const selectedEvent = events.find((e: any) => e.id === selectedEventId);
    const selectedDate = selectedEvent
        ? format(new Date(selectedEvent.date), "yyyy-MM-dd")
        : "";

    // Fetch available staff for selected date (always called, enabled-gated)
    const { data: availableStaff = [], isLoading: isLoadingAvail } = useQuery({
        queryKey: ["staff_availability_date", selectedDate],
        enabled: !!selectedDate,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("staff_availability")
                .select(`*, profiles:user_id(id, nome, cargo, telefone)`)
                .eq("available_date", selectedDate);
            if (error) throw error;
            return data;
        },
    });

    const { allocations, allocateStaff } = useAllocations(
        selectedEventId || undefined
    );

    const allocatedStaffIds = new Set(
        allocations.map((a) => a.staff?.id).filter(Boolean)
    );

    const handleAllocate = (profile: {
        nome: string;
        telefone: string | null;
    }) => {
        // Match profile to magodosdrinks_staff by name or phone
        const matched = staff.find(
            (s) => s.name === profile.nome || s.phone === profile.telefone
        );
        if (!matched) {
            toast.error("Profissional não encontrado no cadastro de equipe");
            return;
        }
        allocateStaff.mutate({
            staffId: matched.id,
            dailyRate: matched.daily_rate || 0,
        });
    };

    return (
        <div className="space-y-6">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Escalar Equipe
            </h2>

            {/* Event Selector */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Selecione o evento
                </label>
                <select
                    className="w-full bg-black/40 border border-white/20 p-3 text-sm font-bold uppercase font-mono rounded-none focus:border-primary focus:outline-none"
                    value={selectedEventId || ""}
                    onChange={(e) => setSelectedEventId(e.target.value || null)}
                >
                    <option value="">-- Escolher evento --</option>
                    {events.map((ev: any) => (
                        <option key={ev.id} value={ev.id}>
                            {ev.client_name} — {format(new Date(ev.date), "dd/MM/yyyy")} —{" "}
                            {ev.location}
                        </option>
                    ))}
                </select>
            </div>

            {/* Selected Event Details & Available Staff */}
            {selectedEvent && (
                <Card className="bg-black/40 border-white/10 rounded-none">
                    <CardContent className="p-6 space-y-6">
                        {/* Event Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono uppercase">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />{" "}
                                {format(new Date(selectedEvent.date), "dd/MM/yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />{" "}
                                {selectedEvent.location || "Local TBD"}
                            </span>
                        </div>

                        {/* Available Staff List */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono mb-3">
                                Profissionais Disponíveis Nesta Data
                            </h3>

                            {isLoadingAvail ? (
                                <p className="text-muted-foreground text-sm font-mono">
                                    Carregando...
                                </p>
                            ) : availableStaff.length === 0 ? (
                                <div className="border-2 border-dashed border-white/10 py-8 text-center">
                                    <p className="text-muted-foreground text-sm font-mono uppercase">
                                        Nenhum profissional marcou disponibilidade para esta data
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {availableStaff.map((entry: any) => {
                                        const profile = entry.profiles;
                                        if (!profile) return null;
                                        const isAllocated = allocatedStaffIds.has(profile.id);

                                        return (
                                            <div
                                                key={entry.id}
                                                className={`flex items-center justify-between border p-4 transition-all ${isAllocated
                                                        ? "border-primary/40 bg-primary/10"
                                                        : "border-white/10 hover:border-white/20"
                                                    }`}
                                            >
                                                <div>
                                                    <p className="font-bold text-sm uppercase font-display">
                                                        {profile.nome}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-mono">
                                                        {profile.cargo} •{" "}
                                                        {profile.telefone || "sem telefone"}
                                                    </p>
                                                </div>
                                                {isAllocated ? (
                                                    <span className="text-xs text-primary font-bold uppercase flex items-center gap-1 font-mono">
                                                        <CheckCircle className="w-4 h-4" /> Alocado
                                                    </span>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleAllocate(profile)}
                                                        disabled={allocateStaff.isPending}
                                                        className="rounded-none border-2 border-primary bg-primary font-bold uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-200 text-xs px-4"
                                                    >
                                                        Escalar
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Already Allocated */}
                        {allocations.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono mb-3">
                                    Equipe Escalada ({allocations.length})
                                </h3>
                                <div className="space-y-1">
                                    {allocations.map((a) => (
                                        <div
                                            key={a.id}
                                            className="flex items-center justify-between border border-primary/20 p-3"
                                        >
                                            <span className="font-bold uppercase text-sm font-display">
                                                {a.staff?.name}
                                            </span>
                                            <span className="text-xs text-primary uppercase font-mono">
                                                {a.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function Escalas() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    return (
        <AppLayout title="Escalas">
            <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8">
                <div className="flex flex-col gap-2">
                    <h1 className="font-display text-3xl font-bold uppercase text-white tracking-tighter">
                        Escalas
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm uppercase">
                        {isAdmin
                            ? "Marque sua disponibilidade e escale a equipe para eventos"
                            : "Marque os dias em que você está disponível para trabalhar"}
                    </p>
                </div>

                {/* Everyone sees the availability calendar */}
                <BartenderAvailabilityView />

                {/* Admins also see the allocation panel */}
                {isAdmin && (
                    <>
                        <hr className="border-white/10" />
                        <AdminSchedulingView />
                    </>
                )}
            </div>
        </AppLayout>
    );
}
