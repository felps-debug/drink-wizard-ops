import React, { useState, useEffect } from 'react';
import { useWhatsappInstance } from '@/hooks/useWhatsappInstance';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, QrCode, LogOut, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

export default function ConfiguracoesWhatsapp() {
    const { instance, isLoading, createInstance, connectInstance, checkStatus, disconnectInstance } = useWhatsappInstance();
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [isGeneratingQr, setIsGeneratingQr] = useState(false);

    // Auto-poll status if connecting
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (instance?.status === 'connecting' || instance?.status === 'disconnected' || (instance && !qrCodeData)) {
            interval = setInterval(async () => {
                try {
                    const status = await checkStatus.mutateAsync({
                        instanceId: instance.instance_id,
                        instanceToken: instance.instance_token
                    });

                    // Se a Uazapi retornar o QR Code no status, atualiza a UI
                    if (status.instance?.qrcode && !qrCodeData) {
                        setQrCodeData(status.instance.qrcode);
                    }

                    if (status.instance?.status === 'connected') {
                        setQrCodeData(null);
                    }
                } catch (e) {
                    console.error("Erro no polling de status:", e);
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [instance?.status, instance?.instance_id, qrCodeData]);

    const handleCreate = () => {
        createInstance.mutate('WhatsApp Empresa');
    };

    const handleConnect = async () => {
        if (!instance) return;
        setIsGeneratingQr(true);
        try {
            const data = await connectInstance.mutateAsync(instance.instance_token);
            // Uazapi costuma retornar o qrcode dentro do objeto instance
            const qr = data.qrcode || data.instance?.qrcode;
            if (qr) {
                setQrCodeData(qr);
            } else {
                // Se não retornar na hora, o useEffect de polling vai pegar logo em seguida
                console.log("QR Code não retornado imediatamente, aguardando polling...");
            }
        } finally {
            setIsGeneratingQr(false);
        }
    };

    const handleDisconnect = () => {
        if (!instance) return;
        disconnectInstance.mutate({
            instanceId: instance.instance_id,
            instanceToken: instance.instance_token
        });
        setQrCodeData(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container p-6 mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">WhatsApp SaaS Integration</h1>

            {!instance ? (
                <Card className="border-2 border-dashed">
                    <CardHeader className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <CardTitle>Conecte o WhatsApp da sua Empresa</CardTitle>
                        <CardDescription>
                            Cada usuário pode ter sua própria instância dedicada para enviar avisos aos profissionais.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button size="lg" onClick={handleCreate} disabled={createInstance.isPending}>
                            {createInstance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Configurar Minha Instância
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        Status da Conexão
                                        <Badge variant={instance.status === 'connected' ? 'success' : 'secondary'}>
                                            {instance.status === 'connected' ? 'Conectado' : 'Offline'}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="font-mono text-xs mt-1">
                                        ID: {instance.instance_id}
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Remover
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {instance.status === 'connected' ? (
                                <div className="bg-success/10 p-4 rounded-lg flex items-center gap-4 border border-success/20">
                                    <CheckCircle2 className="w-8 h-8 text-success" />
                                    <div>
                                        <p className="font-semibold text-success">WhatsApp Ativo!</p>
                                        <p className="text-sm text-success/80">
                                            Sua empresa já está pronta para disparar notificações automáticas.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-warning/10 p-4 rounded-lg flex items-center gap-4 border border-warning/20">
                                        <AlertCircle className="w-8 h-8 text-warning" />
                                        <div>
                                            <p className="font-semibold text-warning">Ação Necessária</p>
                                            <p className="text-sm text-warning/80">
                                                Gere um QR Code e escaneie com seu WhatsApp para ativar.
                                            </p>
                                        </div>
                                    </div>

                                    {!qrCodeData ? (
                                        <Button
                                            className="w-full py-8 text-lg"
                                            onClick={handleConnect}
                                            disabled={isGeneratingQr || instance.status === 'connecting'}
                                        >
                                            {isGeneratingQr || instance.status === 'connecting' ? (
                                                <>
                                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                                    Gerando QR Code...
                                                </>
                                            ) : (
                                                <>
                                                    <QrCode className="mr-2 h-6 w-6" />
                                                    Gerar QR Code de Conexão
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6 p-6 bg-white rounded-xl shadow-inner border">
                                            <div className="relative group">
                                                <img
                                                    src={`data:image/png;base64,${qrCodeData.replace('data:image/png;base64,', '')}`}
                                                    alt="WhatsApp QR Code"
                                                    className="w-64 h-64 shadow-md rounded-lg border-4 border-white"
                                                />
                                                <div className="absolute inset-x-0 -bottom-4 bg-primary text-white text-[10px] py-1 px-3 rounded-full text-center font-bold">
                                                    EXPIRA EM 2 MINUTOS
                                                </div>
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="font-medium text-sm">Abra seu WhatsApp {'>'} Dispositivos Conectados {'>'} Conectar Dispositivo</p>
                                                <Button variant="outline" size="sm" onClick={() => setQrCodeData(null)}>
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Configurações Avançadas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b text-sm">
                                <span className="text-muted-foreground">Token da Instância</span>
                                <span className="font-mono bg-muted px-2 py-0.5 rounded truncate max-w-[200px]">
                                    {instance.instance_token}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b text-sm">
                                <span className="text-muted-foreground">URL Base</span>
                                <span className="text-xs font-mono">workaholicdd.uazapi.com</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
