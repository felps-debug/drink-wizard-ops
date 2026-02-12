import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Phone, Trash2, DollarSign, User } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Equipe() {
  const { user } = useAuth();
  const { staff, isLoading, addStaff, removeStaff } = useStaff();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState(""); // New state
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
        email: formEmail || undefined, // Pass email
        status: formEmail ? 'pending' : 'active',
        role: formRoles[0], // Use first selected role (table only supports single role)
        daily_rate: parseFloat(formDailyRate) || 0
      });
      setIsAddOpen(false);
      setFormName("");
      setFormPhone("");
      setFormEmail("");
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "chefe_bar":
        return "default";
      case "bartender":
        return "secondary";
      case "montador":
        return "outline";
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
      <div className="space-y-6 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-3xl font-bold uppercase text-white">Equipe Tática</h1>
          <p className="text-muted-foreground font-mono text-sm">Gerencie seus profissionais: Bartenders, Chefes de Bar e Montadores.</p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              placeholder="BUSCAR PROFISSIONAL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 font-mono uppercase bg-zinc-900 border-white/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {(['bartender', 'chefe_bar', 'montador'] as StaffRole[]).map((role) => (
            <Card key={role} className="border-white/10 bg-black/40">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{staff.filter(s => s.role === role).length}</p>
                <p className="text-xs font-mono uppercase text-muted-foreground">{getStaffRoleLabel(role)}s</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Staff List */}
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold uppercase text-white border-b-2 border-white/10 pb-2">Profissionais Cadastrados</h2>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground font-mono animate-pulse">CARREGANDO DADOS...</div>
          ) : filteredStaff.map((member) => (
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
                      {getStaffRoleLabel(member.role)}
                    </Badge>
                  </div>

                  <div className="mt-1 flex items-center gap-4 text-xs font-mono uppercase text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {formatPhone(member.phone)}
                    </span>
                    <span className="flex items-center gap-1.5 text-primary">
                      <DollarSign className="h-3 w-3" />
                      R$ {member.daily_rate?.toFixed(2) || '0.00'}/dia
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeStaff.mutate(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {!isLoading && filteredStaff.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-white/10">
              <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-mono text-sm uppercase text-muted-foreground">Nenhum profissional cadastrado</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Clique no + para adicionar</p>
            </div>
          )}
        </div>

        {/* FAB - Add Staff with Dialog */}
        {isAdmin && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
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
                <DialogTitle className="font-display text-2xl uppercase text-primary">Novo Profissional</DialogTitle>
                <DialogDescription className="font-mono text-xs uppercase text-muted-foreground">
                  Cadastre bartenders, chefes de bar ou montadores.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="uppercase font-bold">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="João Silva"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="rounded-none border-white/20 bg-black focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="uppercase font-bold">Email (Para Convite)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="rounded-none border-white/20 bg-black focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground uppercase">Se preenchido, enviará um convite para a caixa de entrada.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="uppercase font-bold">Telefone (WhatsApp)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="11999999999"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                    className="rounded-none border-white/20 bg-black focus:border-primary"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="uppercase font-bold">Funções (Missões Aptas)</Label>
                  <div className="grid grid-cols-2 gap-4 border-2 border-white/10 p-4 bg-black">
                    {(['bartender', 'chefe_bar', 'montador'] as StaffRole[]).map((r) => (
                      <div key={r} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${r}`}
                          checked={formRoles.includes(r)}
                          onCheckedChange={(checked) => {
                            if (checked) setFormRoles([...formRoles, r]);
                            else setFormRoles(formRoles.filter(role => role !== r));
                          }}
                        />
                        <Label htmlFor={`role-${r}`} className="font-mono text-xs uppercase cursor-pointer">
                          {getStaffRoleLabel(r)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate" className="uppercase font-bold">Valor da Diária (R$)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={formDailyRate}
                    onChange={(e) => setFormDailyRate(e.target.value)}
                    className="rounded-none border-white/20 bg-black focus:border-primary"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-none uppercase font-bold">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={formLoading} className="rounded-none bg-primary text-white uppercase font-bold hover:bg-primary/90">
                    {formLoading ? "Salvando..." : "Cadastrar"}
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