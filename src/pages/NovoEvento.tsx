import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEvents } from "@/hooks/useEvents";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { usePackages } from "@/hooks/usePackages";
import { useClients } from "@/hooks/useClients";
import { Plus } from "lucide-react";
import { ClientDialog } from "@/components/clients/ClientDialog";

export default function NovoEvento() {
  const navigate = useNavigate();
  const { addEvent } = useEvents();
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [packageId, setPackageId] = useState<string | undefined>(undefined);


  const [observations, setObservations] = useState("");

  // Client selection state
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const { clients = [], isLoading: loadingClients, addClient: addClientMutation } = useClients();

  // Populate client data when selected
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientPhone(client.phone || "");
    }
  };

  const handleCreateClient = async (data: any) => {
    // Create client and select it
    // Note: addClientMutation logic in useClients should return data ideally, 
    // but standard mutation might not return the new ID easily if not wired up so.
    // However, invalidateQueries will refresh the list.
    // We will rely on the user selecting the new client after creation for now, 
    // or we can try to find it.
    await addClientMutation.mutateAsync(data);
    // We might need to handle auto-selection here if needed, but let's keep it simple.
  };

  const { packages = [], isLoading: loadingPackages } = usePackages();

  // Debug log for packages
  console.log('NovoEvento - Packages:', {
    count: packages?.length || 0,
    loading: loadingPackages,
    hasPackages: Array.isArray(packages) && packages.length > 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Combine date and time to ISO string
      const dateTime = new Date(`${date}T${time}:00`).toISOString();

      await addEvent.mutateAsync({
        clientName,
        clientPhone,
        date: dateTime,
        location,
        contractValue: Number(contractValue),
        status: "agendado", // Default status
        package_id: packageId,
        client_id: selectedClientId || undefined, // Add client_id
        observations
      });

      toast.success("Evento agendado com sucesso!");
      navigate("/eventos");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout title="Novo Evento">
      <div className="mx-auto max-w-2xl space-y-8 p-6 md:p-12">
        <div className="border-b-4 border-foreground pb-6">
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-foreground">
            Novo Evento
          </h1>
          <p className="mt-2 font-mono text-sm uppercase tracking-widest text-muted-foreground">
            Preencha os dados da missão
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Details */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold uppercase text-primary border-l-4 border-primary pl-3">
              Cliente
            </h2>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="clientSelect" className="font-mono text-xs uppercase">
                  Selecionar Cliente Existente
                </Label>
                <Select value={selectedClientId} onValueChange={handleClientSelect}>
                  <SelectTrigger className="border-2 border-border bg-card font-bold uppercase focus:border-primary">
                    <SelectValue placeholder={loadingClients ? "Carregando..." : "Selecione um Cliente..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" onClick={() => setIsClientDialogOpen(true)} className="aspect-square border-2 border-primary bg-primary mb-[2px]">
                <Plus className="h-4 w-4 text-white" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="font-mono text-xs uppercase">
                  Nome do Cliente (Confirmar)
                </Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="border-2 border-border bg-card font-bold uppercase focus:border-primary"
                  placeholder="EX: CLUBE DE ENGENHARIA"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="font-mono text-xs uppercase">
                  Telefone / Contato (Confirmar)
                </Label>
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="border-2 border-border bg-card font-bold uppercase focus:border-primary"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>

            <ClientDialog
              open={isClientDialogOpen}
              onOpenChange={setIsClientDialogOpen}
              onSubmit={handleCreateClient}
            />
          </section>

          {/* Logistics */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold uppercase text-primary border-l-4 border-primary pl-3">
              Logística
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date" className="font-mono text-xs uppercase">
                  Data
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border-2 border-border bg-card font-bold uppercase focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="font-mono text-xs uppercase">
                  Horário de Início
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="border-2 border-border bg-card font-bold uppercase focus:border-primary"
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="location" className="font-mono text-xs uppercase">
                  Localização
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border-2 border-border bg-card font-bold uppercase focus:border-primary"
                  placeholder="ENDEREÇO COMPLETO..."
                  required
                />
              </div>
            </div>
          </section>

          {/* Financials & Extras */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold uppercase text-primary border-l-4 border-primary pl-3">
              Pacote & Detalhes
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="package" className="font-mono text-xs uppercase">
                  Pacote do Evento {loadingPackages && "(Carregando...)"}
                </Label>
                <Select value={packageId} onValueChange={setPackageId} disabled={loadingPackages}>
                  <SelectTrigger className="border-2 border-border bg-card font-bold uppercase focus:border-primary">
                    <SelectValue placeholder={loadingPackages ? "CARREGANDO PACOTES..." : "SELECIONE O PACOTE..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.length === 0 && !loadingPackages ? (
                      <SelectItem value="none" disabled>
                        Nenhum pacote cadastrado
                      </SelectItem>
                    ) : (
                      packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value" className="font-mono text-xs uppercase">
                  Valor do Contrato (R$)
                </Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="border-2 border-border bg-card font-bold uppercase focus:border-primary"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="observations" className="font-mono text-xs uppercase">
                  Observações Extras
                </Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="border-2 border-border bg-card font-bold uppercase focus:border-primary min-h-[100px]"
                  placeholder="EX: 300X COPO PERSONALIZADO, DETALHES DE MONTAGEM..."
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t-2 border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/eventos")}
              className="h-12 border-2 uppercase font-bold px-8 hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 border-2 border-primary bg-primary px-8 font-bold uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
            >
              {isLoading ? "Criando..." : "Confirmar Evento"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
