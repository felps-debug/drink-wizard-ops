import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthReset() {
    const navigate = useNavigate();

    useEffect(() => {
        const clean = async () => {
            console.log('🧹 EXECUTING EMERGENCY CLEANUP 🧹');

            // 1. Clear Supabase Auth
            await supabase.auth.signOut();

            // 2. Nuke LocalStorage & SessionStorage
            localStorage.clear();
            sessionStorage.clear();

            // 3. Force reload to Login
            console.log('✨ Clean complete. Redirecting...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        };

        clean();
    }, []);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-950 text-white font-mono p-4 text-center">
            <h1 className="text-4xl font-bold mb-4">LIMPEZA DE AMBIENTE</h1>
            <p className="text-xl animate-pulse">Limpando dados corrompidos do localhost...</p>
            <p className="text-sm mt-4 text-white/50">Você será redirecionado automaticamente.</p>
        </div>
    );
}
