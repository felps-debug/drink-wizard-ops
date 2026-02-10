import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, BadgeCheck, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

interface UserProfile {
    id: string;
    nome: string;
    cargo: string;
    telefone: string | null;
    email?: string;
}

export default function Profile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({ nome: "", telefone: "" });
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate("/login");
            toast.success("Saiu com sucesso!");
        } catch (error) {
            toast.error("Erro ao sair");
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error("Usuário não autenticado");
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Erro ao buscar perfil:", error);
                toast.error("Erro ao carregar perfil");
            } else if (data) {
                setProfile({ ...data, email: user.email });
                setFormData({ nome: data.nome || "", telefone: data.telefone || "" });
            }
            setIsLoading(false);
        };

        fetchProfile();
    }, []);

    const handleSave = async () => {
        if (!profile) return;

        setIsSaving(true);
        const { error } = await supabase
            .from("profiles")
            .update({
                nome: formData.nome,
                telefone: formData.telefone,
                updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

        if (error) {
            toast.error("Erro ao salvar: " + error.message);
        } else {
            toast.success("Perfil atualizado com sucesso!");
            setProfile({ ...profile, nome: formData.nome, telefone: formData.telefone });
        }
        setIsSaving(false);
    };

    const cargoLabel: Record<string, string> = {
        admin: "Administrador",
        chefe_bar: "Chefe de Bar",
        bartender: "Bartender",
        montador: "Montador",
    };

    if (isLoading) {
        return (
            <AppLayout title="Perfil">
                <div className="flex items-center justify-center p-8">
                    <p className="font-mono animate-pulse">CARREGANDO PERFIL...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Perfil">
            <div className="space-y-6 p-4 md:p-8 pb-24">
                <h1 className="font-display text-3xl font-bold uppercase text-white">Meu Perfil</h1>

                <Card className="rounded-none border-2 border-white/10 bg-card">
                    <CardHeader>
                        <CardTitle className="font-display text-xl uppercase text-primary">
                            Informações Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Email (read-only) */}
                        <div className="space-y-2">
                            <Label className="font-mono text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <Mail className="h-4 w-4" /> E-mail
                            </Label>
                            <Input
                                value={profile?.email || ""}
                                disabled
                                className="font-mono bg-zinc-900 border-white/20"
                            />
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <Label className="font-mono text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> Nome
                            </Label>
                            <Input
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                placeholder="Seu nome completo"
                                className="font-mono bg-zinc-900 border-white/20 focus:border-primary"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label className="font-mono text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Telefone
                            </Label>
                            <Input
                                value={formData.telefone}
                                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                placeholder="(00) 00000-0000"
                                className="font-mono bg-zinc-900 border-white/20 focus:border-primary"
                            />
                        </div>

                        {/* Role (read-only) */}
                        <div className="space-y-2">
                            <Label className="font-mono text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <BadgeCheck className="h-4 w-4" /> Cargo
                            </Label>
                            <div className="flex items-center gap-2 p-3 border-2 border-primary/30 bg-primary/10 rounded-none">
                                <span className="font-display text-lg uppercase text-primary">
                                    {cargoLabel[profile?.cargo || "bartender"] || profile?.cargo}
                                </span>
                            </div>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full rounded-none border-2 border-white bg-primary text-white font-bold uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                        </Button>

                        <div className="pt-6 border-t border-white/10">
                            <Button
                                onClick={handleLogout}
                                variant="destructive"
                                className="w-full rounded-none font-bold uppercase tracking-wide"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair do Sistema
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
