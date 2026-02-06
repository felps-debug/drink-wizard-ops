
import React from "react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/hooks/useEvents";
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipProps, Legend } from 'recharts';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDate } from "@/lib/mock-data";

// Helper for currency
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="font-medium">{label}</p>
        <p className="text-primary">{formatCurrency(payload[0].value as number)}</p>
      </div>
    );
  }
  return null;
};

export default function Relatorios() {
  const { user } = useAuth();
  const { events, isLoading } = useEvents();

  // Redirect if not admin (handled by Route Guard too, but extra safety)
  if (!user || user.role !== "admin") {
    return (
      <AppLayout title="Relatórios">
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="text-center">
            <p className="text-lg font-medium text-primary">Acesso Restrito</p>
            <p className="text-muted-foreground">
              Apenas administradores podem visualizar relatórios.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout title="Relatórios">
        <div className="flex h-screen items-center justify-center">
          <p className="font-mono animate-pulse">CARREGANDO DADOS...</p>
        </div>
      </AppLayout>
    );
  }

  // 1. Filter Completed Events
  const completedEvents = events.filter((e) => e.status === "finalizado");

  // 1.5 Fetch real costs from checklists (Material) + Operational Costs (Manual)
  const [realMaterialCosts, setRealMaterialCosts] = React.useState<Record<string, number>>({});
  const [realOperationalCosts, setRealOperationalCosts] = React.useState<Record<string, number>>({});
  const [realStaffCosts, setRealStaffCosts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const fetchAllCosts = async () => {
      if (completedEvents.length === 0) return;

      const eventIds = completedEvents.map(e => e.id);

      // Fetch Material Costs from Checklists
      const { data: checklists } = await supabase
        .from('checklists')
        .select('event_id, items')
        .in('event_id', eventIds)
        .eq('type', 'saida');

      const matCostsMap: Record<string, number> = {};
      checklists?.forEach(chk => {
        const items = chk.items as any[];
        const eventMaterialCost = items.reduce((sum, item) => {
          const consumed = (item.qtyReceived || item.qtySent) - (item.qtyReturned || 0);
          return sum + (consumed * (item.unitPrice || 0));
        }, 0);
        matCostsMap[chk.event_id] = eventMaterialCost;
      });
      setRealMaterialCosts(matCostsMap);

      // Fetch Operational Costs (Gas/Maintenance/Staff)
      const { data: opCosts } = await supabase
        .from('operational_costs')
        .select('event_id, value')
        .in('event_id', eventIds);

      const opCostsMap: Record<string, number> = {};
      opCosts?.forEach(cost => {
        opCostsMap[cost.event_id] = (opCostsMap[cost.event_id] || 0) + Number(cost.value);
      });
      setRealOperationalCosts(opCostsMap);

      // Fetch Real Staff Costs (Allocations)
      const { data: assignmentsData } = await supabase
        .from('magodosdrinks_allocations')
        .select('event_id, daily_rate')
        .eq('status', 'confirmado');

      const staffMap: Record<string, number> = {};
      if (assignmentsData) {
        assignmentsData.forEach((a: any) => {
          staffMap[a.event_id] = (staffMap[a.event_id] || 0) + Number(a.daily_rate);
        });
      }
      setRealStaffCosts(staffMap);
    };
    fetchAllCosts();
  }, [events]);

  // 2. Metrics Calculation
  const totalRevenue = completedEvents.reduce((acc, e) => acc + (Number(e.contractValue) || 0), 0);
  const totalMaterialCost = Object.values(realMaterialCosts).reduce((a, b) => a + b, 0);
  const totalOperationalCost = Object.values(realOperationalCosts).reduce((a, b) => a + b, 0);

  // If no operational costs registered, fallback to 20% estimate for staff/logistics as per previous logic
  const totalStaffCost = Object.values(realStaffCosts).reduce((a, b) => a + b, 0);
  const adjustedStaffCost = totalStaffCost || (totalRevenue * 0.20);

  const totalCosts = totalMaterialCost + totalOperationalCost + adjustedStaffCost;
  const grossProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const averageTicket = completedEvents.length > 0 ? totalRevenue / completedEvents.length : 0;

  // 3. Prepare Chart Data
  const chartData = events.reduce((acc: any[], event) => {
    const date = new Date(event.date);
    const monthKey = format(date, "MMM/yy", { locale: ptBR });

    const existing = acc.find(i => i.month === monthKey);
    const revenue = Number(event.contractValue) || 0;
    const isCompleted = event.status === 'finalizado';

    const matCost = realMaterialCosts[event.id] || 0;
    const opCost = realOperationalCosts[event.id] || 0;
    const staffCost = realStaffCosts[event.id] || (isCompleted ? (revenue * 0.2) : (revenue * 0.2));
    const cost = matCost + opCost + staffCost;

    if (existing) {
      existing.revenue += revenue;
      existing.cost += cost;
      existing.profit += (revenue - cost);
    } else {
      acc.push({
        month: monthKey,
        revenue,
        cost,
        profit: revenue - cost,
        date: date
      });
    }
    return acc;
  }, []).sort((a, b) => a.date.getTime() - b.date.getTime());


  return (
    <AppLayout title="Relatórios">
      <div className="space-y-6 p-6 md:p-8 animate-in fade-in zoom-in duration-500 pb-24">

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-black uppercase tracking-tighter">
            Performance Financeira
          </h1>
          <p className="text-muted-foreground font-mono text-sm uppercase">
            Visão geral de faturamento e custos reais
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-none border-2 border-white/10 bg-black/40 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.3)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground font-mono">Faturamento Total</p>
                  <p className="font-display text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-white/10 bg-black/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground font-mono">Custos (Mat + Staff)</p>
                  <p className="font-display text-2xl font-bold">{formatCurrency(totalCosts)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-white/10 bg-black/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20 text-success">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground font-mono">Lucro Líquido</p>
                  <p className="font-display text-2xl font-bold text-success">{formatCurrency(grossProfit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-white/10 bg-black/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground font-mono">Eventos Finalizados</p>
                  <p className="font-display text-2xl font-bold">{completedEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 rounded-none border-2 border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle className="font-display uppercase tracking-tight">Evolução de Faturamento</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#888"
                      tick={{ fill: '#888', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#888"
                      tick={{ fill: '#888', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `R$ ${val / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="revenue" name="Receita" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="cost" name="Custos" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="profit" name="Lucro" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROI PER EVENT LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-white/10 pb-2">
            <h2 className="font-display text-2xl font-bold uppercase text-foreground">Retorno por Evento</h2>
            <Badge variant="outline" className="font-mono text-[10px] uppercase">Analytics Detalhado</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedEvents.map((event) => {
              const matCost = realMaterialCosts[event.id] || 0;
              const opCost = realOperationalCosts[event.id] || 0;
              const staffCost = realStaffCosts[event.id] || (Number(event.contractValue) * 0.2);
              const totalCost = matCost + opCost + staffCost;
              const profit = Number(event.contractValue) - totalCost;
              const roi = (profit / Number(event.contractValue)) * 100;

              return (
                <Card key={event.id} className="rounded-none border-2 border-white/10 bg-black/40 hover:border-primary/50 transition-all group">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-display font-bold uppercase group-hover:text-primary transition-colors">{event.clientName}</h3>
                        <p className="font-mono text-[10px] text-muted-foreground uppercase">{formatDate(event.date)}</p>
                      </div>
                      <Badge className={cn("rounded-none px-2 py-1 font-display", roi > 40 ? "bg-success" : roi > 25 ? "bg-primary" : "bg-warning")}>
                        {roi.toFixed(0)}% ROI
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono uppercase">
                        <span className="text-muted-foreground">Contrato:</span>
                        <span className="text-white">{formatCurrency(Number(event.contractValue))}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono uppercase">
                        <span className="text-muted-foreground">Custo Total:</span>
                        <span className="text-destructive">-{formatCurrency(totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold uppercase border-t border-white/5 pt-2 mt-2">
                        <span className="text-white">Lucro Líquido:</span>
                        <span className="text-success">{formatCurrency(profit)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {completedEvents.length === 0 && (
              <div className="col-span-full border-2 border-dashed border-white/10 p-12 text-center text-muted-foreground font-mono text-sm uppercase">
                Nenhum histórico tático de ROI disponível.
              </div>
            )}
          </div>
        </div>
      </div >
    </AppLayout >
  );
}