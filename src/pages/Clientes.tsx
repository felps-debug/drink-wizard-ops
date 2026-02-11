
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, User, FileText, Phone } from "lucide-react";
import { useState } from "react";
import { useClients } from "@/hooks/useClients";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { Client } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";

import { useNavigate } from "react-router-dom";

export default function Clientes() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'chefe_bar';
    const { clients, isLoading, addClient, updateClient } = useClients();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleAddNew = () => {
        setSelectedClient(undefined);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (data: any) => {
        if (selectedClient) {
            await updateClient.mutateAsync({ ...data, id: selectedClient.id, active: true });
        } else {
            await addClient.mutateAsync(data);
        }
    };

    if (isLoading) {
        return (
            <AppLayout title="Clientes">
                <div className="flex items-center justify-center p-8 min-h-screen">
                    <p className="font-mono animate-pulse uppercase text-primary">Carregando Clientes...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Clientes">
            <div className="space-y-6 p-4 md:p-8 pb-32">
                <div className="flex flex-col gap-4">
                    <h1 className="font-display text-3xl font-bold uppercase text-white tracking-tighter">Central de Clientes</h1>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                        <Input
                            placeholder="BUSCAR P/ NOME, TELEFONE..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 font-mono uppercase bg-zinc-900 border-white/20 focus:border-primary h-12 text-sm"
                        />
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map(client => (
                        <Card
                            key={client.id}
                            className="group rounded-none border border-white/10 bg-black/40 hover:border-primary/50 cursor-pointer transition-all"
                            onClick={() => navigate(`/clientes/${client.id}`)}
                        >
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-display text-lg font-bold uppercase text-white group-hover:text-primary transition-colors leading-none">
                                            {client.name}
                                        </h3>
                                        {client.cpf_cnpj && <p className="text-[10px] font-mono text-muted-foreground mt-1 tracking-wider">{client.cpf_cnpj}</p>}
                                    </div>
                                    <User className="w-5 h-5 text-white/20 group-hover:text-primary" />
                                </div>

                                <div className="space-y-1 pt-2 border-t border-white/5">
                                    {client.phone ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-300 font-mono">
                                            <Phone className="w-3 h-3 text-primary" />
                                            {client.phone}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground font-mono uppercase opacity-50">Sem telefone</div>
                                    )}

                                    {client.notes && (
                                        <div className="flex items-start gap-2 text-[10px] uppercase text-muted-foreground border-l-2 border-primary/20 pl-2 mt-2">
                                            <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{client.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredClients.length === 0 && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-white/10 bg-white/5">
                            <p className="font-mono text-sm uppercase text-muted-foreground">
                                {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                            </p>
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <Button
                        size="lg"
                        onClick={handleAddNew}
                        className="fixed bottom-24 right-4 h-16 w-16 rounded-none border-2 border-white bg-primary text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-primary z-50 hover:translate-y-px hover:shadow-[2px_2px_0px_0px_white] transition-all"
                    >
                        <Plus className="h-8 w-8" />
                    </Button>
                )}

                <ClientDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSubmit={handleSubmit}
                    initialData={selectedClient}
                />
            </div>
        </AppLayout>
    );
}
