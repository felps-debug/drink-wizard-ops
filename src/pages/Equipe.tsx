 import { AppLayout } from "@/components/layout/AppLayout";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import { Plus, Search, Phone, Mail } from "lucide-react";
 import { useState } from "react";
 import { users, getRoleLabel, currentUser } from "@/lib/mock-data";
 
 export default function Equipe() {
   const [search, setSearch] = useState("");
 
   const filteredUsers = users.filter(
     (user) =>
       user.name.toLowerCase().includes(search.toLowerCase()) ||
       user.email.toLowerCase().includes(search.toLowerCase())
   );
 
   const getRoleBadgeVariant = (role: string) => {
     switch (role) {
       case "admin":
         return "default";
       case "chefe_bar":
         return "secondary";
       default:
         return "outline";
     }
   };
 
   const getInitials = (name: string) => {
     return name
       .split(" ")
       .map((n) => n[0])
       .join("")
       .toUpperCase()
       .slice(0, 2);
   };
 
   return (
     <AppLayout title="Equipe">
       <div className="space-y-4 p-4">
         {/* Search */}
         <div className="relative">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar membro..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-9"
           />
         </div>
 
         {/* Team List */}
         <div className="space-y-3">
           {filteredUsers.map((user) => (
             <Card key={user.id}>
               <CardContent className="flex items-center gap-4 p-4">
                 <Avatar className="h-12 w-12">
                   <AvatarFallback className="bg-primary/10 text-primary">
                     {getInitials(user.name)}
                   </AvatarFallback>
                 </Avatar>
 
                 <div className="min-w-0 flex-1">
                   <div className="flex items-center gap-2">
                     <h3 className="truncate font-medium">{user.name}</h3>
                     <Badge variant={getRoleBadgeVariant(user.role)}>
                       {getRoleLabel(user.role)}
                     </Badge>
                   </div>
 
                   <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                     <p className="flex items-center gap-1.5">
                       <Mail className="h-3.5 w-3.5" />
                       <span className="truncate">{user.email}</span>
                     </p>
                     {user.phone && (
                       <p className="flex items-center gap-1.5">
                         <Phone className="h-3.5 w-3.5" />
                         {user.phone}
                       </p>
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>
           ))}
 
           {filteredUsers.length === 0 && (
             <div className="py-12 text-center">
               <p className="text-muted-foreground">Nenhum membro encontrado</p>
             </div>
           )}
         </div>
 
         {/* FAB - Add Member */}
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