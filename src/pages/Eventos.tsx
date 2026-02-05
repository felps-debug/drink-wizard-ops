 import { AppLayout } from "@/components/layout/AppLayout";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Plus, Search, MapPin, Phone } from "lucide-react";
 import { Link } from "react-router-dom";
 import { useState } from "react";
 import {
   eventos,
   formatCurrency,
   formatDate,
   getStatusColor,
   getStatusLabel,
   currentUser,
 } from "@/lib/mock-data";
 
 export default function Eventos() {
   const [search, setSearch] = useState("");
   const [filter, setFilter] = useState<string>("all");
 
   const filteredEvents = eventos.filter((event) => {
     const matchesSearch =
       event.clientName.toLowerCase().includes(search.toLowerCase()) ||
       event.location.toLowerCase().includes(search.toLowerCase());
     const matchesFilter = filter === "all" || event.status === filter;
     return matchesSearch && matchesFilter;
   });
 
   const statusFilters = [
     { value: "all", label: "Todos" },
     { value: "agendado", label: "Agendados" },
     { value: "montagem", label: "Montagem" },
     { value: "em_curso", label: "Em Curso" },
     { value: "finalizado", label: "Finalizados" },
   ];
 
   return (
     <AppLayout title="Eventos">
       <div className="space-y-4 p-4">
         {/* Search */}
        <div className="relative btn-gradient rounded-md">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar evento..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
            className="border-white/50 bg-transparent pl-9"
           />
         </div>
 
         {/* Filters */}
         <div className="flex gap-2 overflow-x-auto pb-2">
           {statusFilters.map((s) => (
             <Button
               key={s.value}
              variant={filter === s.value ? "default" : "ghost"}
               size="sm"
               onClick={() => setFilter(s.value)}
              className={filter === s.value ? "btn-gradient-dark shrink-0 text-white" : "btn-gradient shrink-0"}
             >
               {s.label}
             </Button>
           ))}
         </div>
 
         {/* Events List */}
         <div className="space-y-3">
           {filteredEvents.map((event) => (
             <Link key={event.id} to={`/eventos/${event.id}`}>
              <Card className="card-gradient border-0 transition-all hover:shadow-md">
                 <CardContent className="p-4">
                   <div className="flex items-start justify-between gap-3">
                     <div className="min-w-0 flex-1 space-y-2">
                       <div className="flex items-center gap-2">
                         <h3 className="truncate font-semibold">{event.clientName}</h3>
                         <Badge className={getStatusColor(event.status)}>
                           {getStatusLabel(event.status)}
                         </Badge>
                       </div>
 
                       <div className="space-y-1 text-sm text-muted-foreground">
                         <p className="flex items-center gap-1.5">
                           <MapPin className="h-3.5 w-3.5" />
                           <span className="truncate">{event.location}</span>
                         </p>
                         <p className="flex items-center gap-1.5">
                           <Phone className="h-3.5 w-3.5" />
                           {event.clientPhone}
                         </p>
                       </div>
                     </div>
 
                     <div className="text-right">
                       <p className="text-sm font-medium">{formatDate(event.date)}</p>
                       {currentUser.role === "admin" && (
                         <p className="text-sm text-muted-foreground">
                           {formatCurrency(event.contractValue)}
                         </p>
                       )}
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </Link>
           ))}
 
           {filteredEvents.length === 0 && (
             <div className="py-12 text-center">
               <p className="text-muted-foreground">Nenhum evento encontrado</p>
             </div>
           )}
         </div>
 
         {/* FAB - New Event */}
         {(currentUser.role === "admin" || currentUser.role === "chefe_bar") && (
           <Link to="/eventos/novo">
             <Button
               size="lg"
              className="btn-gradient-dark fixed bottom-24 right-4 h-14 w-14 rounded-full text-white shadow-lg"
             >
               <Plus className="h-6 w-6" />
             </Button>
           </Link>
         )}
       </div>
     </AppLayout>
   );
 }