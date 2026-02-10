
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Phone, Edit, Trash2, Mail, FileText } from "lucide-react";
import { useState } from "react";
import { useClients } from "@/hooks/useClients";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { Client } from "@/lib/mock-data";

export default function Clients() {
    const { clients = [], isLoading, addClient, updateClient, deleteClient } = useClients();
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        (client.phone && client.phone.includes(search)) ||
        (client.email && client.email.includes(search))
    );

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja remover este cliente?")) {
            await deleteClient.mutateAsync(id);
        }
    }

    const handleCreateOrUpdate = async (data: any) => {
        if (editingClient) {
            await updateClient.mutateAsync({ ...editingClient, ...data });
        } else {
            await addClient.mutateAsync(data);
        }
    };

    const openNew = () => {
        setEditingClient(undefined);
        setIsDialogOpen(true);
    }

    const openEdit = (client: Client) => {
        setEditingClient(client);
        setIsDialogOpen(true);
    }

    return (
        <AppLayout title="Gestão de Clientes">
            <div className="p-4 space-y-6 container mx-auto max-w-4xl">

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 border-2 border-border/50">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="BUSCAR CLIENTE..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 border-2 border-border bg-black/20 uppercase font-bold focus:border-primary"
                        />
                    </div>
                    <Button onClick={openNew} className="w-full sm:w-auto gap-2 font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="h-4 w-4" />
                        Novo Cliente
                    </Button>
                </div>

                {/* List */}
                <div className="grid gap-3">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-24 bg-card/50 animate-pulse border-l-4 border-muted" />
                        ))
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center p-12 border-2 border-dashed border-muted text-muted-foreground uppercase font-mono">
                            Nenhum cliente encontrado.
                        </div>
                    ) : (
                        filteredClients.map(client => (
                            <Card key={client.id} className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors bg-card/50">
                                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="font-display text-xl font-bold uppercase tracking-tight">{client.name}</h3>
                                        <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground uppercase">
                                            <div className="flex items-center gap-1">
                                                <Phone className="h-3 w-3 text-primary" />
                                                <span>{client.phone || "---"}</span>
                                            </div>
                                            {client.email && (
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3 text-primary" />
                                                    <span className="lowercase">{client.email}</span>
                                                </div>
                                            )}
                                            {client.cpf_cnpj && (
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3 text-primary" />
                                                    <span>{client.cpf_cnpj}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 self-end sm:self-center">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(client)} className="hover:bg-primary/10 hover:text-primary">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(client.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )))}
                </div>

                <ClientDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    initialData={editingClient}
                    onSubmit={handleCreateOrUpdate}
                />
            </div>
        </AppLayout>
    );
}
