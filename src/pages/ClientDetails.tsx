
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClient, useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/mock-data";
import { ArrowLeft, Edit, ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClientDialog } from "@/components/clients/ClientDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: client, isLoading: loadingClient, refetch } = useClient(id);
    const { updateClient, deleteClient } = useClients();
    const { events } = useEvents();

    // Filter events for this client
    const clientEvents = events.filter(e => e.client_id === id);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleUpdateClient = async (data: any) => {
        if (!client) return;
        await updateClient.mutateAsync({ ...client, ...data });
        refetch();
    };

    const handleDeleteClient = async () => {
        if (!client) return;
        await deleteClient.mutateAsync(client.id);
        navigate("/clientes");
    };

    if (loadingClient) {
        return (
            <AppLayout title="Detalhes do Cliente">
                <div className="flex items-center justify-center p-12">
                    <p className="font-mono uppercase animate-pulse">Carregando dados do cliente...</p>
                </div>
            </AppLayout>
        );
    }

    if (!client) {
        return (
            <AppLayout title="Cliente Não Encontrado">
                <div className="flex flex-col items-center justify-center p-12 gap-4">
                    <h1 className="font-display text-2xl uppercase">Cliente não encontrado</h1>
                    <Button onClick={() => navigate("/clientes")} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Clientes
                    </Button>
                </div>
            </AppLayout>
        );
    }

    // Calculate stats
    const totalSpent = clientEvents.reduce((acc, curr) => acc + curr.contractValue, 0);
    const totalEvents = clientEvents.length;

    return (
        <AppLayout title={client.name}>
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-foreground pb-6">
                    <div>
                        <Button variant="ghost" onClick={() => navigate("/clientes")} className="mb-2 pl-0 hover:bg-transparent hover:text-primary font-mono text-xs uppercase">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para lista
                        </Button>
                        <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-foreground">
                            {client.name}
                        </h1>
                        <p className="mt-2 font-mono text-sm uppercase tracking-widest text-muted-foreground">
                            Detalhes e Histórico
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(true)}
                            className="border-2 uppercase font-bold"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="border-2 border-destructive uppercase font-bold"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Info */}
                    <Card className="md:col-span-2 border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                        <CardHeader>
                            <CardTitle className="font-display text-xl uppercase">Informações Cadastrais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 font-mono text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-muted-foreground text-xs uppercase block mb-1">Telefone</label>
                                    <span className="font-bold text-lg">{client.phone || "-"}</span>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs uppercase block mb-1">Email</label>
                                    <span className="font-bold text-lg lowercase">{client.email || "-"}</span>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs uppercase block mb-1">CPF / CNPJ</label>
                                    <span className="font-bold text-lg">{client.cpf_cnpj || "-"}</span>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs uppercase block mb-1">Status</label>
                                    <Badge variant={client.active ? "default" : "destructive"} className="uppercase">
                                        {client.active ? "Ativo" : "Inativo"}
                                    </Badge>
                                </div>
                            </div>
                            {client.notes && (
                                <div className="pt-4 border-t border-border/50">
                                    <label className="text-muted-foreground text-xs uppercase block mb-1">Observações</label>
                                    <p className="bg-muted/50 p-2 rounded whitespace-pre-wrap">{client.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats Stats */}
                    <Card className="border-2 border-primary bg-primary/5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                        <CardHeader>
                            <CardTitle className="font-display text-xl uppercase text-primary">Resumo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <p className="font-mono text-xs uppercase text-muted-foreground">Total de Eventos</p>
                                <p className="font-display text-4xl font-bold">{totalEvents}</p>
                            </div>
                            <div>
                                <p className="font-mono text-xs uppercase text-muted-foreground">Total Gasto</p>
                                <p className="font-display text-4xl font-bold text-primary">{formatCurrency(totalSpent)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Events History */}
                <div className="space-y-4">
                    <h2 className="font-display text-2xl font-bold uppercase text-foreground border-l-4 border-primary pl-3">
                        Histórico de Eventos
                    </h2>

                    {clientEvents.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                            <p className="font-mono uppercase text-muted-foreground">Nenhum evento encontrado para este cliente.</p>
                            <Button
                                variant="link"
                                onClick={() => navigate("/eventos/novo")}
                                className="font-bold uppercase text-primary mt-2"
                            >
                                Criar Novo Evento
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {clientEvents.map(event => (
                                <Card key={event.id} className="group hover:border-primary transition-colors border-2 border-border">
                                    <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-muted-foreground">{formatDate(event.date)}</span>
                                                <Badge className={`uppercase font-bold text-[10px] ${getStatusColor(event.status)}`}>
                                                    {getStatusLabel(event.status)}
                                                </Badge>
                                            </div>
                                            <h3 className="font-display text-lg font-bold uppercase">
                                                {event.name || `Evento ${event.id.substring(0, 6)}`}
                                            </h3>
                                            <p className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                                                {event.location}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                            <p className="font-display font-bold text-lg">{formatCurrency(event.contractValue)}</p>
                                            <Button size="sm" variant="outline" className="uppercase font-bold text-xs" onClick={() => navigate(`/eventos/${event.id}`)}>
                                                Ver Detalhes <ExternalLink className="ml-2 h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dialogs */}
                <ClientDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onSubmit={handleUpdateClient}
                    initialData={client}
                />

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="border-2 border-white bg-zinc-950 text-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-display uppercase text-destructive">Excluir Cliente?</AlertDialogTitle>
                            <AlertDialogDescription className="font-mono text-zinc-400">
                                Esta ação não pode ser desfeita. O cliente será marcado como inativo, mas o histórico de eventos será mantido.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/20 uppercase hover:bg-white/10">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground font-bold uppercase hover:bg-destructive/90">
                                Sim, Excluir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </AppLayout>
    );
}
