import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, CheckSquare, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import {
  formatDate,
  getStatusColor,
  getStatusLabel
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/hooks/useEvents";

export function StaffDashboard() {
  const { user } = useAuth();
  const { events, isLoading } = useEvents();

  // Real filtering for next event
  const myNextEvent = events
    .filter(e => e.status !== 'finalizado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <p className="font-mono text-xs animate-pulse">SINCRONIZANDO ESCALA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-12 pb-24">

      {/* PERSONALIZED WELCOME */}
      <section className="border-b-4 border-foreground pb-8">
        <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground">
          Olá, <br />
          <span className="text-primary">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground bg-primary/10 inline-block px-2 py-1">
          {user?.role === 'admin' ? 'Comandante Geral' :
            user?.role === 'chefe_bar' ? 'Chefe de Operações' :
              user?.role === 'bartender' ? 'Agente de Cocktails' : 'Especialista em Montagem'}
        </p>
      </section>

      {/* NEXT MISSION CARD */}
      <section className="space-y-4">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-l-2 border-primary pl-2">Sua Próxima Missão</h2>

        {myNextEvent ? (
          <Link to={`/eventos/${myNextEvent.id}`}>
            <div className="group relative overflow-hidden border-2 border-primary bg-black/40 transition-all hover:bg-primary/5 rounded-none">
              <div className="absolute -right-12 -top-12 h-32 w-32 rotate-12 bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className={`mb-4 rounded-none px-2 py-0.5 font-mono text-[10px] uppercase ${getStatusColor(myNextEvent.status)}`}>
                      {getStatusLabel(myNextEvent.status)}
                    </Badge>
                    <h3 className="font-display text-3xl font-bold uppercase leading-none md:text-4xl text-white">
                      {myNextEvent.clientName}
                    </h3>
                    <div className="mt-4 flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-mono text-xs uppercase">{formatDate(myNextEvent.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-mono text-xs uppercase">Check-in: 18:00</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-8 w-8 -rotate-45 text-primary transition-transform group-hover:rotate-0" />
                </div>

                <div className="mt-8 border-t border-white/10 pt-4">
                  <p className="font-mono text-[10px] text-muted-foreground uppercase mb-1">LOCAL OPERATIVO</p>
                  <p className="font-display text-lg uppercase text-white font-bold">{myNextEvent.location}</p>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="border-2 border-dashed border-white/10 p-12 text-center bg-black/20">
            <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest">Nenhuma missão agendada.</p>
          </div>
        )}
      </section>

      {/* QUICK ACCESS */}
      <section className="grid gap-4 md:grid-cols-2">
        <Link to="/escalas">
          <div className="border-2 border-white/10 bg-black/20 p-6 hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold uppercase group-hover:text-primary transition-colors">Calendário Tático</h3>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 font-mono text-[10px] text-muted-foreground uppercase">Verificar datas disponíveis e escalas</p>
          </div>
        </Link>

        {user?.role !== 'bartender' && user?.role !== 'montador' && (
          <Link to="/eventos">
            <div className="border-2 border-white/10 bg-black/20 p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold uppercase group-hover:text-primary transition-colors">Checklists</h3>
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 font-mono text-[10px] text-muted-foreground uppercase">Conferir materiais e sobras de eventos</p>
            </div>
          </Link>
        )}
      </section>

    </div>
  );
}
