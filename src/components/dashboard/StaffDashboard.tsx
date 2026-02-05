import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, CheckSquare, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  eventos, 
  formatDate,
  getStatusColor,
  getStatusLabel 
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StaffDashboard() {
  const { user } = useAuth();
  
  // For now, filtering upcoming events roughly. In real app, filter by assigned users.
  const myNextEvent = eventos
    .filter(e => e.status === 'agendado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const pendingTasks = 5; // Mock pending tasks count

  return (
    <div className="space-y-8 p-6 md:p-12">
      
      {/* PERSONALIZED WELCOME */}
      <section className="border-b-4 border-foreground pb-8">
         <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground">
           Olá, <br/>
           <span className="text-primary">{user?.name?.split(' ')[0]}</span>
         </h1>
         <p className="mt-2 font-mono text-sm uppercase tracking-widest text-muted-foreground">
           {user?.role === 'bartender' ? 'Bartender Operativo' : 'Equipe de Apoio'}
         </p>
      </section>

      {/* NEXT MISSION CARD */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Sua Próxima Missão</h2>
        
        {myNextEvent ? (
          <Link to={`/eventos/${myNextEvent.id}`}>
            <div className="group relative overflow-hidden border-2 border-primary bg-card transition-all hover:bg-primary/5">
              <div className="absolute -right-12 -top-12 h-32 w-32 rotate-12 bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />
              
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className={`mb-4 rounded-none ${getStatusColor(myNextEvent.status)}`}>
                      CONFIRMADO
                    </Badge>
                    <h3 className="font-display text-3xl font-bold uppercase leading-none md:text-4xl">
                      {myNextEvent.clientName}
                    </h3>
                    <div className="mt-4 flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-mono text-sm">{formatDate(myNextEvent.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-sm">19:00 - 02:00</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-8 w-8 -rotate-45 text-primary transition-transform group-hover:rotate-0" />
                </div>

                <div className="mt-8 border-t border-border pt-4">
                  <p className="font-mono text-xs text-muted-foreground">LOCALIZAÇÃO</p>
                  <p className="mt-1 font-medium uppercase">{myNextEvent.location}</p>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="border-2 border-dashed border-muted p-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">Nenhuma missão agendada.</p>
          </div>
        )}
      </section>

      {/* QUICK STATS / TASKS */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="border-2 border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold uppercase">Checklists</h3>
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-bold">{pendingTasks}</p>
          <p className="font-mono text-xs text-muted-foreground">Itens pendentes</p>
          <Button variant="outline" className="mt-4 w-full border-2 text-xs uppercase" size="sm">
            Ver Checklists
          </Button>
        </div>

        <div className="border-2 border-border bg-card p-6">
           <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold uppercase">Escala</h3>
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-bold">2</p>
          <p className="font-mono text-xs text-muted-foreground">Eventos esta semana</p>
          <Button variant="outline" className="mt-4 w-full border-2 text-xs uppercase" size="sm">
            Ver Calendário
          </Button>
        </div>
      </section>

    </div>
  );
}
