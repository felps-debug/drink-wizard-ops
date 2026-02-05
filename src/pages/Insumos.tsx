 import { AppLayout } from "@/components/layout/AppLayout";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Plus, Search } from "lucide-react";
 import { useState } from "react";
 import { insumos, formatCurrency, currentUser } from "@/lib/mock-data";
 
 export default function Insumos() {
   const [search, setSearch] = useState("");
   const [categoryFilter, setCategoryFilter] = useState<string>("all");
 
   const categories = ["all", ...new Set(insumos.map((i) => i.category))];
 
   const filteredInsumos = insumos.filter((insumo) => {
     const matchesSearch = insumo.name.toLowerCase().includes(search.toLowerCase());
     const matchesCategory = categoryFilter === "all" || insumo.category === categoryFilter;
     return matchesSearch && matchesCategory;
   });
 
   const groupedInsumos = filteredInsumos.reduce(
     (acc, insumo) => {
       if (!acc[insumo.category]) {
         acc[insumo.category] = [];
       }
       acc[insumo.category].push(insumo);
       return acc;
     },
     {} as Record<string, typeof insumos>
   );
 
   return (
     <AppLayout title="Insumos">
       <div className="space-y-4 p-4">
         {/* Search */}
         <div className="relative">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar insumo..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-9"
           />
         </div>
 
         {/* Category Filters */}
         <div className="flex gap-2 overflow-x-auto pb-2">
           {categories.map((cat) => (
             <Button
               key={cat}
               variant={categoryFilter === cat ? "default" : "outline"}
               size="sm"
               onClick={() => setCategoryFilter(cat)}
               className="shrink-0"
             >
               {cat === "all" ? "Todos" : cat}
             </Button>
           ))}
         </div>
 
         {/* Insumos List by Category */}
         <div className="space-y-6">
           {Object.entries(groupedInsumos).map(([category, items]) => (
             <div key={category}>
               <h3 className="mb-3 text-sm font-medium text-muted-foreground">{category}</h3>
               <div className="space-y-2">
                 {items.map((insumo) => (
                   <Card key={insumo.id}>
                     <CardContent className="flex items-center justify-between p-4">
                       <div>
                         <p className="font-medium">{insumo.name}</p>
                         <p className="text-sm text-muted-foreground">{insumo.unit}</p>
                       </div>
                       {currentUser.role === "admin" && (
                         <Badge variant="secondary" className="font-mono">
                           {formatCurrency(insumo.currentPrice)}
                         </Badge>
                       )}
                     </CardContent>
                   </Card>
                 ))}
               </div>
             </div>
           ))}
 
           {Object.keys(groupedInsumos).length === 0 && (
             <div className="py-12 text-center">
               <p className="text-muted-foreground">Nenhum insumo encontrado</p>
             </div>
           )}
         </div>
 
         {/* FAB - New Insumo */}
         {currentUser.role === "admin" && (
           <Button
             size="lg"
             className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg"
           >
             <Plus className="h-6 w-6" />
           </Button>
         )}
       </div>
     </AppLayout>
   );
 }