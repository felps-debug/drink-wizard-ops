import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useAutomations } from "@/hooks/useAutomations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Bot, MessageSquare, Zap, Trash2 } from "lucide-react";
import { AutomationTrigger } from "@/types/automation";

export default function Automacoes() {
  const { user } = useAuth();
  const { automations, isLoading, addAutomation, toggleAutomation, deleteAutomation } = useAutomations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<AutomationTrigger>("event_created");
  const [message, setMessage] = useState("Olá {client_name}, seu evento em {date} está confirmado!");

  const handleCreate = () => {
    addAutomation.mutate({
      name,
      trigger_event: trigger,
      trigger_conditions: {}, // Future: Add condition builder
      action_type: "whatsapp_message",
      action_config: { message },
      active: true,
    });
    setIsDialogOpen(false);
    setName("");
    setMessage("");
  };

  if (!user || user.role !== "admin") {
    return (
      <AppLayout title="Automações">
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Acesso restrito.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Automações">
      <div className="space-y-6 p-6 md:p-8 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tighter">
              Automações & Bots
            </h1>
            <p className="text-muted-foreground font-mono text-sm uppercase">
              Gerencie regras automáticas e disparos de mensagens
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] card-gradient border-white/10">
              <DialogHeader>
                <DialogTitle>Mágica de Automação ✨</DialogTitle>
                <CardDescription>Configure o gatilho e a ação desejada.</CardDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome da Regra</Label>
                  <Input 
                    placeholder="Ex: Boas vindas ao Cliente" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-black/50 border-white/10"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Gatilho (Quando isso acontecer...)</Label>
                  <Select value={trigger} onValueChange={(v) => setTrigger(v as AutomationTrigger)}>
                    <SelectTrigger className="bg-black/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_created">Novo Evento Criado</SelectItem>
                      <SelectItem value="status_changed">Status do Evento Mudou</SelectItem>
                      {/* <SelectItem value="event_updated">Evento Atualizado</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Ação (Faça isso...)</Label>
                  <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/50 p-3 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    Enviar WhatsApp via Z-API
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Mensagem (Template)</Label>
                  <Textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Olá {client_name}..."
                    className="min-h-[100px] bg-black/50 border-white/10 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Variáveis: <code className="text-primary">{`{client_name}`}</code>, <code className="text-primary">{`{date}`}</code>, <code className="text-primary">{`{location}`}</code>
                  </p>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!name || !message} className="w-full btn-gradient">
                Salvar Automação
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Automations List */}
        <div className="grid gap-4">
          {isLoading ? (
            <p className="text-muted-foreground font-mono animate-pulse">Carregando robôs...</p>
          ) : automations.length === 0 ? (
             <Card className="border-dashed border-2 border-muted bg-transparent p-8 text-center">
               <div className="flex justify-center mb-4">
                 <Bot className="h-12 w-12 text-muted-foreground/50" />
               </div>
               <h3 className="text-lg font-medium">Nenhuma automação ativa</h3>
               <p className="text-muted-foreground">Crie sua primeira regra para automatizar o atendimento.</p>
             </Card>
          ) : (
            automations.map((auto) => (
              <Card key={auto.id} className="card-gradient border-0 ring-1 ring-white/10 transition-all hover:ring-primary/50">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{auto.name}</h3>
                        <Badge variant="outline" className="text-xs font-mono uppercase">
                          {auto.trigger_event.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span className="line-clamp-1 max-w-[300px] md:max-w-[500px]">
                          {auto.action_config.message}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`switch-${auto.id}`} className="text-xs text-muted-foreground uppercase">
                        {auto.active ? 'Ativo' : 'Pausado'}
                      </Label>
                      <Switch 
                        id={`switch-${auto.id}`}
                        checked={auto.active}
                        onCheckedChange={(checked) => toggleAutomation.mutate({ id: auto.id, active: checked })}
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja excluir esta automação?")) {
                          deleteAutomation.mutate(auto.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </AppLayout>
  );
}
