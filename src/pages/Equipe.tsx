 import { AppLayout } from "@/components/layout/AppLayout";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import { Plus, Search, Phone, Mail, Trash2, Check, Clock } from "lucide-react";
 import { useState } from "react";
 import { getRoleLabel, UserRole } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
 
 export default function Equipe() {
  const { user } = useAuth();
  const { members, invites, isLoading, inviteMember, revokeInvite } = useTeam();
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  
  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("bartender");
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole });
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteRole("bartender");
    } catch (err) {
      console.error(err);
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
       <div className="space-y-6 p-4 md:p-8">
         {/* Header */}
         <div className="flex flex-col gap-4">
            <h1 className="font-display text-3xl font-bold uppercase text-white">Equipe Tática</h1>
            
            {/* Search */}
             <div className="relative">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
               <Input
                 placeholder="BUSCAR OPERADOR..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-9 font-mono uppercase bg-zinc-900 border-white/20 focus:border-primary"
               />
             </div>
         </div>

 
         {/* Invites Section (Only Admin) */}
         {user?.role === 'admin' && invites.length > 0 && (
           <div className="space-y-3">
             <h2 className="font-display text-xl font-bold uppercase text-primary border-b-2 border-primary/20 pb-2">Convites Pendentes</h2>
             {invites.map((invite) => (
                <Card key={invite.id} className="rounded-none border-2 border-dashed border-white/20 bg-card/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                       <div className="flex h-10 w-10 items-center justify-center bg-muted">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                       </div>
                       <div>
                         <p className="font-mono text-sm uppercase text-white">{invite.email}</p>
                         <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{getRoleLabel(invite.role)}</Badge>
                            <span className="text-xs text-muted-foreground uppercase">Aguardando registro</span>
                         </div>
                       </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover:text-destructive hover:bg-destructive/10"
                      onClick={() => revokeInvite.mutate(invite.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
             ))}
           </div>
         )}

         {/* Active Team List */}
         <div className="space-y-3">
           <h2 className="font-display text-xl font-bold uppercase text-white border-b-2 border-white/10 pb-2">Membros Ativos</h2>
           
           {isLoading ? (
              <div className="py-8 text-center text-muted-foreground font-mono animate-pulse">CARREGANDO DADOS...</div>
           ) : filteredMembers.map((member) => (
            <Card key={member.id} className="group rounded-none border-2 border-white/10 bg-card transition-all hover:border-primary hover:bg-white/5">
               <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12 border-2 border-primary rounded-none">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                     {getInitials(member.name)}
                   </AvatarFallback>
                 </Avatar>
 
                 <div className="min-w-0 flex-1">
                   <div className="flex items-center gap-2">
                     <h3 className="truncate font-display text-lg font-bold uppercase text-white group-hover:text-primary transition-colors">{member.name}</h3>
                     <Badge className={`rounded-none border px-2 py-0.5 font-mono text-[10px] uppercase font-bold`} variant={getRoleBadgeVariant(member.role)}>
                       {getRoleLabel(member.role)}
                     </Badge>
                   </div>
 
                   <div className="mt-1 space-y-0.5 text-xs font-mono uppercase text-muted-foreground">
                     {member.email && (
                       <p className="flex items-center gap-1.5">
                         <Mail className="h-3 w-3" />
                         <span className="truncate">{member.email}</span>
                       </p>
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>
           ))}
 
           {!isLoading && filteredMembers.length === 0 && (
             <div className="py-12 text-center border-2 border-dashed border-white/10">
               <p className="font-mono text-sm uppercase text-muted-foreground">Nenhum membro encontrado</p>
             </div>
           )}
         </div>
 
         {/* FAB - Add Member with Dialog */}
         {user && user.role === "admin" && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
               <Button
                 size="lg"
                className="fixed bottom-24 right-4 h-16 w-16 rounded-none border-2 border-white bg-primary text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-primary hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
               >
                 <Plus className="h-8 w-8" />
               </Button>
              </DialogTrigger>
              <DialogContent className="border-2 border-primary bg-zinc-950 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl uppercase text-primary">Convidar Novo Agente</DialogTitle>
                  <DialogDescription className="font-mono text-xs uppercase text-muted-foreground">
                    O acesso será concedido automaticamente ao se registrar com este email.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="uppercase font-bold">Email do Agente</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="rounded-none border-white/20 bg-black focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="uppercase font-bold">Função Tática</Label>
                    <Select value={inviteRole} onValueChange={(val: UserRole) => setInviteRole(val)}>
                      <SelectTrigger className="rounded-none border-white/20 bg-black focus:border-primary">
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bartender">Bartender</SelectItem>
                        <SelectItem value="chefe_bar">Chefe de Bar</SelectItem>
                        <SelectItem value="admin">Admin / Operador</SelectItem>
                        <SelectItem value="montador">Montador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)} className="rounded-none uppercase font-bold">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={inviteLoading} className="rounded-none bg-primary text-white uppercase font-bold hover:bg-primary/90">
                      {inviteLoading ? "Enviando..." : "Enviar Convite"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
         )}
       </div>
     </AppLayout>
   );
 }