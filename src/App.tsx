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
import AuthReset from "./pages/AuthReset";
import ChecklistEntrada from "./pages/ChecklistEntrada";
import ChecklistSaida from "./pages/ChecklistSaida";
import Profile from "./pages/Profile";
import Escalas from "./pages/Escalas";
import Pacotes from "./pages/Pacotes";
import PackageDetails from "./pages/PackageDetails";
import Clientes from "./pages/Clientes";
import ClientDetails from "./pages/ClientDetails";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
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
              <Route path="/auth-reset" element={<AuthReset />} />

              {/* Admin & Chefe de Bar Routes - Defined FIRST to match /eventos/novo before /eventos/:id */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'chefe_bar']} />}>
                <Route path="/insumos" element={<Insumos />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/clientes/:id" element={<ClientDetails />} />
                <Route path="/eventos/novo" element={<NovoEvento />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/equipe" element={<Equipe />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/automacoes" element={<Automacoes />} />
                <Route path="/pacotes" element={<Pacotes />} />
                <Route path="/pacotes/:id" element={<PackageDetails />} />
              </Route>

              {/* Protected Routes - Generic */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/eventos" element={<Eventos />} />
                {/* Moved :id route down so it doesn't shadow 'novo' */}
                <Route path="/eventos/:id" element={<EventoDetalhe />} />
                <Route path="/eventos/:id/checklist-entrada" element={<ChecklistEntrada />} />
                <Route path="/eventos/:id/checklist-saida" element={<ChecklistSaida />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/escalas" element={<Escalas />} />
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
