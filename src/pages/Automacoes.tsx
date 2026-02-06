import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAutomations } from "@/hooks/useAutomations";
import { Zap, Plus, BellRing } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function Automacoes() {
  const { automations, isLoading, createAutomation, toggleAutomation } = useAutomations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    await createAutomation.mutateAsync({
      name,
      event_type: eventType,
      action_type: 'whatsapp',
      template_message: message,
      active: true
    });
    setIsDialogOpen(false);
    setName("");
    setEventType("");
    setMessage("");
  };

  return (
    <AppLayout title="Automações">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between border-b-4 border-foreground pb-4">
          <div>
            <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-primary">Automações</h1>
            <p className="font-mono text-xs uppercase text-muted-foreground">Logística & Notificações Inteligentes</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-none border-2 border-primary bg-primary font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                <Plus className="mr-2 h-4 w-4" /> Criar Gatilho
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-none border-2 border-white bg-zinc-950">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl uppercase font-black">Nova Automação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">Nome da Regra</Label>
                  <Input
                    placeholder="EX: Agradecimento Pós-Checklist"
                    className="rounded-none border-2 border-white/20 bg-black font-bold uppercase"
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">Quando Disparar? (Gatilho)</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="rounded-none border-2 border-white/20 bg-black font-bold">
                      <SelectValue placeholder="SELECIONE O EVENTO..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checklist_entrada_concluido">CHECKLIST ENTRADA CONCLUÍDO</SelectItem>
                      <SelectItem value="checklist_saida_concluido">CHECKLIST SAÍDA CONCLUÍDO</SelectItem>
                      <SelectItem value="evento_agendado">NOVO EVENTO AGENDADO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase">Mensagem WhatsApp (Template)</Label>
                  <Textarea
                    placeholder="Olá {cliente}, seu checklist foi concluído!"
                    className="rounded-none border-2 border-white/20 bg-black font-bold h-32"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Dica: use {`{cliente}, {data}, {local}`}</p>
                </div>

                <Button
                  className="w-full h-12 mt-4 rounded-none border-2 border-white bg-white text-black font-black uppercase hover:bg-primary hover:text-white transition-all"
                  onClick={handleSubmit}
                  disabled={!name || !eventType || !message}
                >
                  Ativar Automação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {automations.map((auto) => (
            <Card key={auto.id} className="rounded-none border-2 border-white/10 bg-black/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="font-display text-xl uppercase font-black">{auto.name}</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase text-primary font-bold">
                    Gatilho: {auto.event_type.replace(/_/g, ' ')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={auto.active}
                    onCheckedChange={(val) => toggleAutomation.mutate({ id: auto.id, active: val })}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white/5 p-3 border border-white/5 rounded-none flex gap-3">
                  <BellRing className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="font-mono text-xs text-muted-foreground italic leading-relaxed">
                    "{auto.template_message}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {automations.length === 0 && !isLoading && (
            <div className="py-20 text-center border-2 border-dashed border-white/10">
              <Zap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-mono text-sm uppercase text-muted-foreground">O sistema ainda não está operando no automático</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
