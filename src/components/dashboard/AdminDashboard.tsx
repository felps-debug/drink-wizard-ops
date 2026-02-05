import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Activity, DollarSign, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  eventos, 
  formatCurrency, 
  formatDate,
  getStatusColor,
  getStatusLabel 
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";

export function AdminDashboard() {
  const { user } = useAuth();
  const upcomingEvents = eventos.filter(e => e.status !== 'finalizado').slice(0, 3);
  
  // Calculate Stats
  const revenue = eventos
    .filter(e => e.status === 'finalizado')
    .reduce((acc, curr) => acc + curr.contractValue, 0);

  const activeEventsCount = eventos.filter(e => e.status === 'em_curso').length;
  
  // Mock stats for display
  const stats = {
    revenue,
    activeEvents: activeEventsCount,
    totalStaff: 12,
    efficiency: 98
  };

  return (
    <div className="space-y-12 p-6 md:p-12 overflow-x-hidden">
      
      {/* MASSIVE HERO SECTION */}
      <section className="relative flex flex-col justify-center border-b-4 border-foreground pb-12 pt-16 md:pt-0">
         <div className="absolute top-0 right-0 left-0 md:left-auto p-2 md:p-4 border-b-2 md:border-2 border-primary bg-primary/20 backdrop-blur-none text-center md:text-right">
            <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-primary font-bold animate-pulse">
              System Status: Online
            </span>
         </div>
         
         <h1 className="font-display text-[3.5rem] md:text-[8rem] lg:text-[10rem] font-black uppercase leading-[0.9] md:leading-[0.8] tracking-tighter text-foreground select-none mt-8 md:mt-0">
           Mago
           <span className="block text-transparent stroke-text-white dark:stroke-text-white hover:text-primary transition-colors duration-300">
             Dos Drinks
           </span>
         </h1>
         
         <div className="mt-8 max-w-xl border-l-4 border-primary pl-6">
           <p className="font-mono text-sm md:text-lg uppercase tracking-widest text-muted-foreground">
             Operações Táticas &<br/> Controle de Eventos
           </p>
         </div>
      </section>

      {/* CONTROL PANEL STATS */}
      <section className="grid gap-0 md:grid-cols-2 lg:grid-cols-4 border-2 border-border">
        <div className="group relative border-b-2 border-r-2 border-border bg-card/50 p-8 transition-colors hover:bg-primary/10">
          <div className="absolute top-4 right-4">
            <DollarSign className="h-6 w-6 text-primary group-hover:text-foreground transition-colors" />
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Faturamento Mensal</p>
          <p className="font-display text-4xl font-bold text-foreground neon-text">{formatCurrency(stats.revenue)}</p>
          <div className="mt-4 h-1 w-full bg-muted">
            <div className="h-full w-[75%] bg-primary"></div>
          </div>
        </div>

        <div className="group relative border-b-2 border-r-2 border-border bg-card/50 p-8 transition-colors hover:bg-success/10">
           <div className="absolute top-4 right-4">
            <Calendar className="h-6 w-6 text-success group-hover:text-foreground transition-colors" />
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Eventos Ativos</p>
          <p className="font-display text-4xl font-bold text-foreground">{stats.activeEvents}</p>
           <div className="mt-4 flex gap-1">
             {[...Array(5)].map((_, i) => (
               <div key={i} className={`h-2 w-2 rounded-none ${i < stats.activeEvents ? 'bg-success' : 'bg-muted'}`} />
             ))}
           </div>
        </div>

        <div className="group relative border-b-2 border-r-2 border-border bg-card/50 p-8 transition-colors hover:bg-warning/10">
           <div className="absolute top-4 right-4">
            <Users className="h-6 w-6 text-warning group-hover:text-foreground transition-colors" />
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Equipe Disponível</p>
          <p className="font-display text-4xl font-bold text-foreground">{stats.totalStaff}</p>
           <p className="mt-2 font-mono text-xs text-warning">8 em serviço</p>
        </div>

         <div className="group relative border-b-2 border-border bg-card/50 p-8 transition-colors hover:bg-destructive/10">
           <div className="absolute top-4 right-4">
            <Activity className="h-6 w-6 text-destructive group-hover:text-foreground transition-colors" />
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Eficiência</p>
          <p className="font-display text-4xl font-bold text-foreground">98%</p>
          <div className="mt-4 h-1 w-full bg-muted flex justify-end">
            <div className="h-full w-[98%] bg-destructive"></div>
          </div>
        </div>
      </section>

      {/* ACTION GRID */}
      <section className="grid gap-6 md:grid-cols-2">
         {/* Quick Actions */}
         <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-border pb-2">
              <h2 className="font-display text-2xl font-bold uppercase text-foreground">Acesso Rápido</h2>
              <div className="h-2 w-2 bg-primary animate-pulse" />
            </div>
            <div className="grid gap-4">
               {user && (user.role === 'admin' || user.role === 'chefe_bar') && (
                <Link to="/eventos/novo">
                  <Button variant="default" className="w-full justify-between h-20 text-lg border-2">
                    <span className="flex items-center gap-3">
                       <div className="bg-white text-primary p-1">
                         <Plus className="h-6 w-6" />
                       </div>
                       NOVO EVENTO
                    </span>
                    <ArrowRight className="h-6 w-6 opacity-0 -translate-x-4 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </Button>
                </Link>
              )}
               <Link to="/insumos">
                  <Button variant="outline" className="w-full justify-between h-20 text-lg border-2 hover:bg-primary/20 hover:text-white hover:border-primary">
                    <span className="flex items-center gap-3">
                       INVENTÁRIO
                    </span>
                     <span className="font-mono text-xs">VERIFICAR ESTOQUE -&gt;</span>
                  </Button>
                </Link>
            </div>
         </div>

         {/* Upcoming Events Feed */}
         <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-border pb-2">
              <h2 className="font-display text-2xl font-bold uppercase text-foreground">Próximos Eventos</h2>
              <Link to="/eventos" className="font-mono text-xs text-primary hover:underline uppercase">Ver Todos</Link>
            </div>
            
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                 <Link key={event.id} to={`/eventos/${event.id}`}>
                  <div className="group relative flex items-center justify-between border-l-4 border-border bg-card p-4 transition-all hover:border-primary hover:bg-muted hover:pl-6">
                     <div>
                        <p className="font-display text-lg font-bold text-foreground uppercase">{event.clientName}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <Badge className={`rounded-none px-1 py-0 text-[10px] ${getStatusColor(event.status)}`}>
                             {getStatusLabel(event.status)}
                           </Badge>
                           <span className="font-mono text-xs text-muted-foreground">{formatDate(event.date)}</span>
                        </div>
                     </div>
                     <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                 </Link>
              ))}
            </div>
         </div>
      </section>
    </div>
  );
}
