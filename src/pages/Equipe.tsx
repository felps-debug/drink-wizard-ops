import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Phone, Trash2, DollarSign, User, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStaff, StaffRole, getStaffRoleLabel } from "@/hooks/useStaff";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Equipe() {
  const { user } = useAuth();
  const { staff, isLoading, addStaff, removeStaff } = useStaff();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRoles, setFormRoles] = useState<StaffRole[]>(["bartender"]);
  const [formDailyRate, setFormDailyRate] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await addStaff.mutateAsync({
        name: formName,
        phone: formPhone,
        role: formRoles[0], // Use first selected role (table only supports single role)
        daily_rate: parseFloat(formDailyRate) || 0
      });
      setIsAddOpen(false);
      setFormName("");
      setFormPhone("");
      setFormRoles(["bartender"]);
      setFormDailyRate("");
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AppLayout title="Equipe">
      <div className="min-h-screen bg-background p-4 md:p-8 animate-enter-slide-up">
        {/* Massive Header */}
        <div className="mb-12">
          <h1 className="font-display text-[12vw] leading-[0.8] uppercase tracking-tighter text-foreground">
            Equipe
            <span className="text-primary block md:inline">.Tática</span>
          </h1>
          
          <div className="mt-8 flex flex-col md:flex-row gap-6 md:items-end md:justify-between border-b border-white/20 pb-8">
            <div className="max-w-md">
              <p className="font-mono text-sm uppercase text-muted-foreground/80 leading-relaxed border-l-2 border-primary pl-4">
                PROTOCOL: MANAGE_OPERATIVES<br/>
                STATUS: {staff.length} UNITS ACTIVE<br/>
                ACCESS: {isAdmin ? "GRANTED (ADMIN)" : "READ ONLY"}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="BUSCAR OPERADOR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 font-mono uppercase bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 text-xl"
              />
            </div>
          </div>
        </div>

        {/* Brutalist List */}
        <div className="flex flex-col">
          {isLoading ? (
            <div className="py-20 text-center font-mono animate-pulse text-primary">
              [LOADING_DATABASE...]
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10">
               <p className="font-mono text-muted-foreground">NO_OPERATIVES_FOUND</p>
            </div>
          ) : (
            filteredStaff.map((member, index) => (
              <div 
                key={member.id} 
                className="group relative flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 py-6 md:py-10 hover:bg-primary hover:text-black transition-all duration-300 md:hover:px-8 cursor-default"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Left: Role & Name */}
                <div className="flex flex-col gap-1 z-10 w-full md:w-auto">
                    <Badge variant="outline" className={`w-fit rounded-none border-primary/50 group-hover:border-black group-hover:text-black font-mono text-[10px] uppercase mb-2 ${member.role === 'chefe_bar' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                        {getStaffRoleLabel(member.role)}
                    </Badge>
                    <h3 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight group-hover:translate-x-2 transition-transform duration-300">
                        {member.name}
                    </h3>
                </div>

                {/* Right: Meta Data */}
                <div className="flex items-center gap-8 mt-4 md:mt-0 z-10 font-mono text-sm uppercase text-muted-foreground group-hover:text-black/70">
                   <div className="flex items-center gap-2">
                     <Phone className="h-4 w-4" />
                     {formatPhone(member.phone)}
                   </div>
                   <div className="flex items-center gap-2">
                     <DollarSign className="h-4 w-4" />
                     {member.daily_rate?.toFixed(2)}
                   </div>
                   
                   {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                          e.stopPropagation();
                          removeStaff.mutate(member.id);
                      }}
                      className="hover:bg-black/20 hover:text-red-600 rounded-none group-hover:text-black"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                   )}
                </div>

                {/* Hover Reveal Avatar (Desktop) */}
                <div className="absolute right-[20%] top-1/2 -translate-y-1/2 hidden md:block opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-500 ease-out pointer-events-none z-20">
                     <Avatar className="h-48 w-48 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <AvatarFallback className="bg-white text-black font-display text-6xl font-bold">
                            {getInitials(member.name)}
                        </AvatarFallback>
                     </Avatar>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FAB - Add Staff */}
        {isAdmin && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="fixed bottom-12 right-12 h-20 w-20 rounded-none bg-primary text-black font-bold shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200 z-50 group"
              >
                <Plus className="h-10 w-10 group-hover:rotate-90 transition-transform duration-300" />
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-primary bg-black/95 backdrop-blur-xl sm:max-w-md rounded-none p-0 gap-0">
              <DialogHeader className="p-6 border-b border-white/10 bg-white/5">
                <DialogTitle className="font-display text-3xl uppercase text-primary tracking-tighter">Novo Agente</DialogTitle>
                <DialogDescription className="font-mono text-xs uppercase text-muted-foreground">
                  INSERIR DADOS DO NOVO COLABORADOR NO SISTEMA.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAdd} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="uppercase font-bold font-mono text-xs text-primary">Nome Completo</Label>
                    <Input
                      id="name"
                      placeholder="HEX CODENAME"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="rounded-none border-0 border-b-2 border-white/20 bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary font-display text-xl uppercase placeholder:text-white/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="uppercase font-bold font-mono text-xs text-primary">Comunicação (WhatsApp)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="00 00000-0000"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      required
                      className="rounded-none border-0 border-b-2 border-white/20 bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary font-mono text-lg placeholder:text-white/20"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="uppercase font-bold font-mono text-xs text-primary">Classificação</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {(['bartender', 'chefe_bar', 'montador'] as StaffRole[]).map((r) => (
                        <div key={r} onClick={() => setFormRoles([r])} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${formRoles.includes(r) ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30'}`}>
                           <div className={`w-4 h-4 border ${formRoles.includes(r) ? 'bg-primary border-primary' : 'border-white/50'}`} />
                           <span className="font-mono text-sm uppercase">{getStaffRoleLabel(r)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate" className="uppercase font-bold font-mono text-xs text-primary">Taxa Diária (BRL)</Label>
                    <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">$</span>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formDailyRate}
                          onChange={(e) => setFormDailyRate(e.target.value)}
                          className="rounded-none border-0 border-b-2 border-white/20 bg-transparent pl-6 focus-visible:ring-0 focus-visible:border-primary font-mono text-lg placeholder:text-white/20"
                        />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-none uppercase font-bold hover:bg-white/10 hover:text-white">
                    Abortar
                  </Button>
                  <Button type="submit" disabled={formLoading} className="rounded-none bg-primary text-black hover:bg-primary/90 uppercase font-bold px-8">
                    {formLoading ? "Processando..." : "Confirmar"}
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