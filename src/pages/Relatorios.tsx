 import { AppLayout } from "@/components/layout/AppLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import {
   eventos,
   custosOperacionais,
   formatCurrency,
   currentUser,
 } from "@/lib/mock-data";
 import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
 
 export default function Relatorios() {
   // Only admin can see this page content
   if (currentUser.role !== "admin") {
     return (
       <AppLayout title="Relatórios">
         <div className="flex min-h-[60vh] items-center justify-center p-4">
           <div className="text-center">
            <p className="text-lg font-medium text-primary">Acesso Restrito</p>
             <p className="text-muted-foreground">
               Apenas administradores podem visualizar relatórios financeiros.
             </p>
           </div>
         </div>
       </AppLayout>
     );
   }
 
   const completedEvents = eventos.filter((e) => e.status === "finalizado");
   const totalRevenue = completedEvents.reduce((acc, e) => acc + e.contractValue, 0);
   const totalCosts = custosOperacionais.reduce((acc, c) => acc + c.value, 0);
   const grossProfit = totalRevenue - totalCosts;
   const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
 
   return (
     <AppLayout title="Relatórios">
       <div className="space-y-6 p-4">
         {/* Summary Cards */}
         <div className="grid grid-cols-2 gap-3">
          <Card className="stat-card-gradient border-0">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 text-muted-foreground">
                <div className="btn-gradient-dark flex h-6 w-6 items-center justify-center rounded-full">
                  <DollarSign className="h-3.5 w-3.5 text-white" />
                </div>
                 <span className="text-xs">Faturamento</span>
               </div>
              <p className="mt-1 text-xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
             </CardContent>
           </Card>
 
          <Card className="stat-card-gradient border-0">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 text-muted-foreground">
                <div className="btn-gradient-dark flex h-6 w-6 items-center justify-center rounded-full">
                  <TrendingDown className="h-3.5 w-3.5 text-white" />
                </div>
                 <span className="text-xs">Custos</span>
               </div>
               <p className="mt-1 text-xl font-bold">{formatCurrency(totalCosts)}</p>
             </CardContent>
           </Card>
 
          <Card className="stat-card-gradient border-0">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 text-muted-foreground">
                <div className="btn-gradient-dark flex h-6 w-6 items-center justify-center rounded-full">
                  <TrendingUp className="h-3.5 w-3.5 text-white" />
                </div>
                 <span className="text-xs">Lucro Bruto</span>
               </div>
               <p className="mt-1 text-xl font-bold text-success">
                 {formatCurrency(grossProfit)}
               </p>
             </CardContent>
           </Card>
 
          <Card className="stat-card-gradient border-0">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 text-muted-foreground">
                <div className="btn-gradient-dark flex h-6 w-6 items-center justify-center rounded-full">
                  <Calendar className="h-3.5 w-3.5 text-white" />
                </div>
                 <span className="text-xs">Eventos</span>
               </div>
               <p className="mt-1 text-xl font-bold">{completedEvents.length}</p>
             </CardContent>
           </Card>
         </div>
 
         {/* Profit Margin */}
        <Card className="card-gradient border-0">
           <CardHeader className="pb-2">
             <CardTitle className="text-base">Margem de Lucro</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex items-end justify-between">
               <div>
                <p className="text-3xl font-bold text-primary">{profitMargin.toFixed(1)}%</p>
                 <p className="text-sm text-muted-foreground">sobre o faturamento</p>
               </div>
               <Badge
                 variant={profitMargin >= 30 ? "default" : "secondary"}
                 className={profitMargin >= 30 ? "bg-success" : ""}
               >
                 {profitMargin >= 30 ? "Saudável" : "Atenção"}
               </Badge>
             </div>
           </CardContent>
         </Card>
 
         {/* Events Performance */}
        <Card className="card-gradient border-0">
           <CardHeader className="pb-2">
             <CardTitle className="text-base">Eventos Finalizados</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             {completedEvents.map((event) => {
               const eventCosts = custosOperacionais
                 .filter((c) => c.eventId === event.id)
                 .reduce((acc, c) => acc + c.value, 0);
               const eventProfit = event.contractValue - eventCosts;
               const eventMargin =
                 event.contractValue > 0
                   ? (eventProfit / event.contractValue) * 100
                   : 0;
 
               return (
                 <div
                   key={event.id}
                  className="btn-gradient flex items-center justify-between rounded-lg border border-white/50 p-3"
                 >
                   <div>
                     <p className="font-medium">{event.clientName}</p>
                     <p className="text-xs text-muted-foreground">
                      Contrato: <span className="text-primary">{formatCurrency(event.contractValue)}</span>
                     </p>
                   </div>
                   <div className="text-right">
                     <p className="font-medium text-success">
                       {formatCurrency(eventProfit)}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {eventMargin.toFixed(0)}% margem
                     </p>
                   </div>
                 </div>
               );
             })}
 
             {completedEvents.length === 0 && (
               <p className="py-4 text-center text-sm text-muted-foreground">
                 Nenhum evento finalizado ainda
               </p>
             )}
           </CardContent>
         </Card>
 
         {/* Costs Breakdown */}
        <Card className="card-gradient border-0">
           <CardHeader className="pb-2">
             <CardTitle className="text-base">Custos Operacionais</CardTitle>
           </CardHeader>
           <CardContent className="space-y-2">
             {custosOperacionais.map((custo) => (
               <div
                 key={custo.id}
                 className="flex items-center justify-between py-2"
               >
                 <div>
                   <p className="text-sm font-medium">{custo.description}</p>
                  <p className="text-xs text-primary">{custo.category}</p>
                 </div>
                 <p className="font-mono text-sm">{formatCurrency(custo.value)}</p>
               </div>
             ))}
 
             {custosOperacionais.length === 0 && (
               <p className="py-4 text-center text-sm text-muted-foreground">
                 Nenhum custo registrado
               </p>
             )}
           </CardContent>
         </Card>
       </div>
     </AppLayout>
   );
 }