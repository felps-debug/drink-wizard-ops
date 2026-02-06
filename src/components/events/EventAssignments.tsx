import { useState } from 'react';
import { useAllocations } from '@/hooks/useAllocations';
import { useStaff, getStaffRoleLabel } from '@/hooks/useStaff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, AlertCircle, Check, Send } from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';

interface EventAssignmentsProps {
    eventId: string;
    eventName: string;
    eventDate: string;
    eventLocation?: string;
}

export function EventAssignments({ eventId, eventName, eventDate, eventLocation }: EventAssignmentsProps) {
    const { allocations, isLoading: allocLoading, allocateStaff, confirmAndNotify, removeAllocation } = useAllocations(eventId);
    const { staff, isLoading: staffLoading } = useStaff();
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [rate, setRate] = useState('150'); // Default daily rate

    const availableStaff = staff.filter(
        (s) => !allocations.some((a) => a.staff_id === s.id)
    );

    const handleAdd = () => {
        if (!selectedStaffId || !rate) return;
        allocateStaff.mutate({ staffId: selectedStaffId, dailyRate: Number(rate) });
        setSelectedStaffId('');
    };

    const isLoading = allocLoading || staffLoading;

    return (
        <Card className="rounded-none border-2 border-white/10 bg-black/40">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-xl uppercase tracking-tight text-white">Escala Operacional</CardTitle>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {allocations.length} Integrantes
                </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* ADD FORM */}
                <div className="flex gap-2 items-end border-b pb-6 border-white/10">
                    <div className="flex-1 space-y-2">
                        <span className="text-xs font-bold uppercase text-muted-foreground">Profissional</span>
                        <Select value={selectedStaffId} onValueChange={(val) => {
                            setSelectedStaffId(val);
                            const selected = staff.find(s => s.id === val);
                            if (selected?.daily_rate) setRate(selected.daily_rate.toString());
                        }}>
                            <SelectTrigger className="rounded-none bg-black/50 border-white/20">
                                <SelectValue placeholder={staff.length === 0 ? "CADASTRE PROFISSIONAIS EM 'EQUIPE'..." : "SELECIONE..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableStaff.length === 0 && staff.length > 0 && (
                                    <div className="p-2 text-xs text-muted-foreground uppercase font-mono">Todos já escalados</div>
                                )}
                                {staff.length === 0 && (
                                    <div className="p-2 text-xs text-warning uppercase font-mono">Nenhum profissional no banco</div>
                                )}
                                {availableStaff.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name} ({getStaffRoleLabel(s.role)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-32 space-y-2">
                        <span className="text-xs font-bold uppercase text-muted-foreground">Diária (R$)</span>
                        <Input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            className="rounded-none bg-black/50 border-white/20 font-mono"
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        disabled={!selectedStaffId || allocateStaff.isPending}
                        className="rounded-none bg-primary text-white hover:bg-primary/90 rounded-none mb-[2px]"
                    >
                        {allocateStaff.isPending ? "..." : "ADICIONAR"}
                    </Button>
                </div>

                {/* LIST */}
                <div className="space-y-3">
                    {isLoading ? (
                        <p className="text-center font-mono text-xs animate-pulse text-muted-foreground">CARREGANDO ESCALA...</p>
                    ) : allocations.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-white/10">
                            <p className="font-mono text-sm text-muted-foreground uppercase">Nenhum profissional escalado</p>
                        </div>
                    ) : (
                        allocations.map((allocation) => (
                            <div key={allocation.id} className="group flex items-center justify-between p-3 bg-white/5 border border-white/10 hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 rounded-none border border-white/20">
                                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                            {allocation.staff?.name?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold uppercase text-sm text-white">{allocation.staff?.name}</p>
                                            <Badge variant="secondary" className="text-[10px] h-5 rounded-none px-1">
                                                {getStaffRoleLabel(allocation.staff?.role as any)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                                            <span>{formatCurrency(allocation.daily_rate)}</span>
                                            <span>•</span>
                                            <span className={allocation.status === 'confirmado' ? 'text-success' : 'text-warning'}>
                                                {allocation.status?.toUpperCase() || 'PENDENTE'}
                                            </span>
                                            {allocation.staff?.phone ? (
                                                <span className="text-emerald-500 flex items-center gap-1">
                                                    • <Check className={`w-3 h-3 ${allocation.whatsapp_sent ? 'text-primary' : ''}`} />
                                                    {allocation.whatsapp_sent ? 'Notificado' : 'WhatsApp'}
                                                </span>
                                            ) : (
                                                <span className="text-destructive flex items-center gap-1">• <AlertCircle className="w-3 h-3" /> Sem Tel</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* NOTIFY BUTTON */}
                                    {allocation.status !== 'confirmado' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={confirmAndNotify.isPending}
                                            className="rounded-none h-8 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                                            onClick={() => confirmAndNotify.mutate({
                                                allocationId: allocation.id,
                                                staffName: allocation.staff?.name || '',
                                                staffPhone: allocation.staff?.phone || '',
                                                eventName,
                                                eventDate,
                                                eventLocation: eventLocation || ''
                                            })}
                                        >
                                            <Send className="w-3 h-3 mr-2" />
                                            {confirmAndNotify.isPending ? "..." : "CONVOCAR"}
                                        </Button>
                                    )}

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none"
                                        onClick={() => removeAllocation.mutate(allocation.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
