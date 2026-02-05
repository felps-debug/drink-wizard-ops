import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Package, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  eventos,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  currentUser,
} from "@/lib/mock-data";

const Index = () => {
  const upcomingEvents = eventos.filter((e) => e.status !== "finalizado").slice(0, 3);
  const totalRevenue = eventos
    .filter((e) => e.status === "finalizado")
    .reduce((acc, e) => acc + e.contractValue, 0);
  const activeEvents = eventos.filter((e) => e.status === "em_curso").length;
  const scheduledEvents = eventos.filter((e) => e.status === "agendado").length;

  return (
    <AppLayout>
      <div className="space-y-6 p-4">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold">Olá, {currentUser.name.split(" ")[0]}!</h2>
          <p className="text-muted-foreground">Aqui está o resumo do seu dia</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="stat-card-gradient border-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="btn-gradient-dark flex h-10 w-10 items-center justify-center rounded-full">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledEvents}</p>
                <p className="text-xs text-muted-foreground">Agendados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card-gradient border-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="btn-gradient-dark flex h-10 w-10 items-center justify-center rounded-full">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeEvents}</p>
                <p className="text-xs text-muted-foreground">Em Curso</p>
              </div>
            </CardContent>
          </Card>

          {currentUser.role === "admin" && (
            <>
              <Card className="stat-card-gradient border-0">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="btn-gradient-dark flex h-10 w-10 items-center justify-center rounded-full">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Faturado</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card-gradient border-0">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="btn-gradient-dark flex h-10 w-10 items-center justify-center rounded-full">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">10</p>
                    <p className="text-xs text-muted-foreground">Insumos</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Upcoming Events */}
        <Card className="card-gradient border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Próximos Eventos</CardTitle>
            <Link to="/eventos">
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                Ver todos
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                to={`/eventos/${event.id}`}
                className="btn-gradient flex items-center justify-between rounded-lg border border-white/50 p-3 transition-all hover:shadow-md"
              >
                <div className="space-y-1">
                  <p className="font-medium leading-tight">{event.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.date)} • {event.location}
                  </p>
                </div>
                <Badge className={getStatusColor(event.status)}>
                  {getStatusLabel(event.status)}
                </Badge>
              </Link>
            ))}

            {upcomingEvents.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum evento agendado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-gradient border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link to="/eventos/novo">
              <Button variant="outline" className="btn-gradient h-auto w-full flex-col gap-1 border-white/50 py-4 hover:shadow-md">
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Novo Evento</span>
              </Button>
            </Link>
            <Link to="/insumos">
              <Button variant="outline" className="btn-gradient h-auto w-full flex-col gap-1 border-white/50 py-4 hover:shadow-md">
                <Package className="h-5 w-5" />
                <span className="text-xs">Ver Insumos</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Index;
