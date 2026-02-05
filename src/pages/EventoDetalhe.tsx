 import { useParams, useNavigate } from "react-router-dom";
 import { ArrowLeft, MapPin, Phone, Calendar, DollarSign, Check, User } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { useState } from "react";
 import {
   eventos,
   checklistItems,
   formatCurrency,
   formatDate,
   getStatusColor,
   getStatusLabel,
   currentUser,
   ChecklistItem,
 } from "@/lib/mock-data";
 
 export default function EventoDetalhe() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   
   const evento = eventos.find((e) => e.id === id);
   const eventChecklist = checklistItems.filter((item) => item.eventId === id);
   
   const [items, setItems] = useState<ChecklistItem[]>(eventChecklist);
   const [checkedItems, setCheckedItems] = useState<Set<string>>(
     new Set(eventChecklist.filter((item) => item.quantityBack !== null).map((item) => item.id))
   );
 
   if (!evento) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <div className="text-center">
           <p className="text-muted-foreground">Evento não encontrado</p>
           <Button variant="link" onClick={() => navigate("/eventos")} className="text-primary">
             Voltar para eventos
           </Button>
         </div>
       </div>
     );
   }
 
   const handleCheckItem = (itemId: string) => {
     setCheckedItems((prev) => {
       const next = new Set(prev);
       if (next.has(itemId)) {
         next.delete(itemId);
       } else {
         next.add(itemId);
       }
       return next;
     });
   };
 
   const handleQuantityBackChange = (itemId: string, value: string) => {
     const numValue = value === "" ? null : parseInt(value, 10);
     setItems((prev) =>
       prev.map((item) =>
         item.id === itemId
           ? { ...item, quantityBack: numValue, checkedBy: numValue !== null ? currentUser.name : null }
           : item
       )
     );
   };
 
   const getConsumo = (item: ChecklistItem) => {
     if (item.quantityBack === null) return null;
     return item.quantityOut - item.quantityBack;
   };
 
   const canEdit = currentUser.role === "admin" || currentUser.role === "chefe_bar";
 
   return (
     <div className="flex min-h-screen flex-col bg-background">
       {/* Header */}
       <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
         <div className="flex h-14 items-center gap-3 px-4">
           <Button variant="ghost" size="icon" onClick={() => navigate("/eventos")}>
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <div className="flex-1">
             <h1 className="truncate font-semibold">{evento.clientName}</h1>
           </div>
           <Badge className={getStatusColor(evento.status)}>
             {getStatusLabel(evento.status)}
           </Badge>
         </div>
       </header>
 
       {/* Event Info */}
       <div className="space-y-4 p-4">
         <Card className="card-gradient border-0">
           <CardContent className="space-y-3 p-4">
             <div className="flex items-center gap-2 text-sm">
               <MapPin className="h-4 w-4 text-primary" />
               <span>{evento.location}</span>
             </div>
             <div className="flex items-center gap-2 text-sm">
               <Phone className="h-4 w-4 text-primary" />
               <span>{evento.clientPhone}</span>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-sm">
                 <Calendar className="h-4 w-4 text-primary" />
                 <span>{formatDate(evento.date)}</span>
               </div>
               {currentUser.role === "admin" && (
                 <div className="flex items-center gap-2 text-sm font-medium text-primary">
                   <DollarSign className="h-4 w-4" />
                   <span>{formatCurrency(evento.contractValue)}</span>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
 
         {/* Checklist Tabs */}
         <Tabs defaultValue="entrada" className="w-full">
           <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="entrada">Checklist Entrada</TabsTrigger>
             <TabsTrigger value="saida">Checklist Saída</TabsTrigger>
           </TabsList>
 
           <TabsContent value="entrada" className="mt-4 space-y-3">
             {items.length === 0 ? (
               <p className="py-8 text-center text-muted-foreground">
                 Nenhum item no checklist
               </p>
             ) : (
               items.map((item) => (
                 <Card key={item.id} className="card-gradient border-0">
                   <CardContent className="flex items-center gap-3 p-4">
                     <Checkbox
                       checked={checkedItems.has(item.id)}
                       onCheckedChange={() => handleCheckItem(item.id)}
                       disabled={!canEdit}
                     />
                     <div className="flex-1">
                       <p className="font-medium">{item.insumoName}</p>
                       <p className="text-sm text-muted-foreground">
                         Quantidade: <span className="font-medium text-foreground">{item.quantityOut}</span>
                       </p>
                     </div>
                     {checkedItems.has(item.id) && (
                       <Check className="h-5 w-5 text-primary" />
                     )}
                   </CardContent>
                 </Card>
               ))
             )}
           </TabsContent>
 
           <TabsContent value="saida" className="mt-4 space-y-3">
             {items.length === 0 ? (
               <p className="py-8 text-center text-muted-foreground">
                 Nenhum item no checklist
               </p>
             ) : (
               items.map((item) => {
                 const consumo = getConsumo(item);
                 return (
                   <Card key={item.id} className="card-gradient border-0">
                     <CardContent className="space-y-3 p-4">
                       <div className="flex items-start justify-between">
                         <div>
                           <p className="font-medium">{item.insumoName}</p>
                           <p className="text-sm text-muted-foreground">
                             Saída: <span className="font-medium text-foreground">{item.quantityOut}</span>
                           </p>
                         </div>
                         {consumo !== null && (
                           <Badge variant="outline" className="border-primary text-primary">
                             Consumo: {consumo}
                           </Badge>
                         )}
                       </div>
 
                       <div className="flex items-center gap-3">
                         <div className="flex-1">
                           <Label htmlFor={`return-${item.id}`} className="text-xs text-muted-foreground">
                             Retorno
                           </Label>
                           <Input
                             id={`return-${item.id}`}
                             type="number"
                             min="0"
                             max={item.quantityOut}
                             value={item.quantityBack ?? ""}
                             onChange={(e) => handleQuantityBackChange(item.id, e.target.value)}
                             placeholder="0"
                             disabled={!canEdit}
                             className="h-9"
                           />
                         </div>
                         {item.checkedBy && (
                           <div className="flex items-center gap-1 text-xs text-muted-foreground">
                             <User className="h-3 w-3" />
                             <span>{item.checkedBy}</span>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 );
               })
             )}
           </TabsContent>
         </Tabs>
       </div>
     </div>
   );
 }