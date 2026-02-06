import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  eventos as mockEventos,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getRoleLabel
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/hooks/useEvents";

export default function Eventos() {
  const { user } = useAuth();
  const { events, isLoading, deleteEvent } = useEvents();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.clientName.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || event.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <AppLayout title="Eventos">
        <div className="flex items-center justify-center p-8">
          <p className="font-mono animate-pulse">CARREGANDO DADOS...</p>
        </div>
      </AppLayout>
    );
  }

  const statusFilters = [
    { value: "all", label: "Todos" },
    { value: "agendado", label: "Agendados" },
    { value: "montagem", label: "Montagem" },
    { value: "em_curso", label: "Em Curso" },
    { value: "finalizado", label: "Finalizados" },
  ];

  return (
    <AppLayout title="Eventos">
      <div className="space-y-6 p-4 md:p-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-3xl font-bold uppercase text-white">Gestão de Eventos</h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              placeholder="BUSCAR EVENTO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 font-mono uppercase bg-zinc-900 border-white/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {statusFilters.map((s) => (
            <Button
              key={s.value}
              variant={filter === s.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s.value)}
              className={`shrink-0 border-2 font-bold uppercase tracking-wider ${filter === s.value
                  ? "bg-primary text-white border-primary"
                  : "bg-transparent text-muted-foreground border-white/20 hover:border-primary hover:text-white"
                }`}
            >
              {s.label}
            </Button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Link key={event.id} to={`/eventos/${event.id}`}>
              <Card className="group relative overflow-hidden rounded-none border-2 border-white/10 bg-card transition-all hover:border-primary hover:bg-white/5 active:translate-x-1 active:translate-y-1">
                <div className="absolute left-0 top-0 h-full w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h3 className="truncate font-display text-xl font-bold uppercase leading-none text-white group-hover:text-primary transition-colors">
                            {event.clientName}
                          </h3>
                          <Badge className={`rounded-none border px-2 py-0.5 font-mono text-[10px] uppercase font-bold ${getStatusColor(event.status)}`}>
                            {getStatusLabel(event.status)}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1.5 font-mono text-xs text-muted-foreground">
                        <p className="flex items-center gap-2 uppercase tracking-wide">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="truncate">{event.location}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          {event.clientPhone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <p className="font-mono text-sm font-bold text-white uppercase">{formatDate(event.date)}</p>
                    {user?.role === 'admin' && (
                      <p className="font-display text-lg font-bold text-primary neon-text">
                        {formatCurrency(event.contractValue)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {filteredEvents.length === 0 && (
            <div className="border-2 border-dashed border-white/20 py-12 text-center">
              <p className="font-mono text-sm uppercase text-muted-foreground">Nenhum evento encontrado</p>
            </div>
          )}
        </div>

        {/* FAB - New Event */}
        {user && ['admin', 'chefe_bar'].includes(user.role) && (
          <Link to="/eventos/novo">
            <Button
              size="lg"
              className="fixed bottom-24 right-4 h-16 w-16 rounded-none border-2 border-white bg-primary text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-primary hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
            >
              <Plus className="h-8 w-8" />
            </Button>
          </Link>
        )}
      </div>
    </AppLayout>
  );
}