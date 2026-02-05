
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/hooks/useEvents";
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipProps } from 'recharts';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  // 2. Metrics Calculation
  const totalRevenue = completedEvents.reduce((acc, e) => acc + (Number(e.contractValue) || 0), 0);
  // Mock costs for now as we don't have a Costs table yet
  const estimatedCosts = totalRevenue * 0.4; 
  const grossProfit = totalRevenue - estimatedCosts;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const averageTicket = completedEvents.length > 0 ? totalRevenue / completedEvents.length : 0;

  // 3. Prepare Chart Data (Revenue per Month)
  const chartData = events.reduce((acc: any[], event) => {
    const date = new Date(event.date);
    const monthKey = format(date, "MMM/yy", { locale: ptBR });
    
    const existing = acc.find(i => i.month === monthKey);
    const value = Number(event.contractValue) || 0;

    if (existing) {
      existing.total += value;
    } else {
      acc.push({ month: monthKey, total: value, date: date }); // keep date for sorting
    }
    return acc;
  }, []).sort((a, b) => a.date.getTime() - b.date.getTime());


  return (
    <AppLayout title="Relatórios">
      <div className="space-y-6 p-6 md:p-8 animate-in fade-in zoom-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-black uppercase tracking-tighter">
              Performance Financeira
            </h1>
            <p className="text-muted-foreground font-mono text-sm uppercase">
              Visão geral de faturamento e custos
            </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-0 ring-1 ring-white/10 transition-all hover:ring-primary/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Faturamento Total</p>
                  <p className="font-display text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-0 ring-1 ring-white/10 transition-all hover:ring-primary/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Custos (Est.)</p>
                  <p className="font-display text-2xl font-bold">{formatCurrency(estimatedCosts)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-0 ring-1 ring-white/10 transition-all hover:ring-primary/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-success">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Lucro Líquido</p>
                  <p className="font-display text-2xl font-bold text-success">{formatCurrency(grossProfit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

           <Card className="card-gradient border-0 ring-1 ring-white/10 transition-all hover:ring-primary/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Eventos Realizados</p>
                  <p className="font-display text-2xl font-bold">{completedEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Chart */}
          <Card className="md:col-span-2 border-0 bg-card/50">
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
                      tick={{fill: '#888', fontSize: 12}} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#888" 
                      tick={{fill: '#888', fontSize: 12}} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => `R$ ${val/1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Bar 
                      dataKey="total" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* KPI List */}
          <Card className="border-0 bg-card/50">
             <CardHeader>
              <CardTitle className="font-display uppercase tracking-tight">Indicadores Chave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Ticket Médio</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                     TARGET: R$ 5k
                  </Badge>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(averageTicket)}</p>
                <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${Math.min((averageTicket/5000)*100, 100)}%` }} 
                  />
                </div>
              </div>

               <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Margem de Lucro</span>
                  <Badge variant="outline" className={profitMargin > 50 ? "text-success border-success/20 bg-success/10" : "text-warning border-warning/20 bg-warning/10"}>
                     {profitMargin > 50 ? "EXCELENTE" : "REGULAR"}
                  </Badge>
                </div>
                <p className="text-3xl font-bold">{profitMargin.toFixed(0)}%</p>
                 <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${profitMargin>50 ? 'bg-success' : 'bg-warning'}`} 
                    style={{ width: `${Math.min(profitMargin, 100)}%` }} 
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Dica do Sistema</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sua margem está saudável! Tente renegociar contratos de fornecedores para alcançar 65%.
                    </p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}