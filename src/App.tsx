import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Eventos from "./pages/Eventos";
import Insumos from "./pages/Insumos";
import Equipe from "./pages/Equipe";
import Relatorios from "./pages/Relatorios";
import Automacoes from "./pages/Automacoes";
import EventoDetalhe from "./pages/EventoDetalhe";
import NovoEvento from "./pages/NovoEvento";
import Login from "./pages/Login";
import ChecklistEntrada from "./pages/ChecklistEntrada";
import ChecklistSaida from "./pages/ChecklistSaida";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Public or General Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/eventos/:id" element={<EventoDetalhe />} />
                <Route path="/eventos/:id/checklist-entrada" element={<ChecklistEntrada />} />
                <Route path="/eventos/:id/checklist-saida" element={<ChecklistSaida />} />
              </Route>


              {/* Admin & Chefe de Bar Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'chefe_bar']} />}>
                 <Route path="/insumos" element={<Insumos />} />
                 <Route path="/eventos/novo" element={<NovoEvento />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/equipe" element={<Equipe />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/automacoes" element={<Automacoes />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
