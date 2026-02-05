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
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledEvents}</p>
                <p className="text-xs text-muted-foreground">Agendados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeEvents}</p>
                <p className="text-xs text-muted-foreground">Em Curso</p>
              </div>
            </CardContent>
          </Card>

          {currentUser.role === "admin" && (
            <>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                    <DollarSign className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Faturado</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <Package className="h-5 w-5 text-secondary-foreground" />
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
        <Card>
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
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link to="/eventos/novo">
              <Button variant="outline" className="h-auto w-full flex-col gap-1 py-4">
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Novo Evento</span>
              </Button>
            </Link>
            <Link to="/insumos">
              <Button variant="outline" className="h-auto w-full flex-col gap-1 py-4">
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
