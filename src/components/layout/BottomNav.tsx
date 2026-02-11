
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Package, Users, BarChart3, Settings, Wine, User, Building2, Bot } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      icon: Home,
      label: "Início",
      path: "/",
      roles: ['admin', 'chefe_bar', 'bartender', 'montador', 'entregador']
    },
    {
      icon: Calendar,
      label: "Eventos",
      path: "/eventos",
      roles: ['admin', 'chefe_bar', 'bartender']
    },
    {
      icon: Wine,
      label: "Insumos",
      path: "/insumos",
      roles: ['admin', 'chefe_bar']
    },
    {
      icon: Building2,
      label: "Clientes",
      path: "/clientes",
      roles: ['admin', 'chefe_bar']
    },
    {
      icon: Package,
      label: "Pacotes",
      path: "/pacotes",
      roles: ['admin'] // Only admin for now, logic can change
    },
    {
      icon: Users,
      label: "Equipe",
      path: "/equipe",
      roles: ['admin']
    },
    {
      icon: BarChart3,
      label: "Metrics",
      path: "/relatorios",
      roles: ['admin']
    },
    {
      icon: Bot,
      label: "Automações",
      path: "/automacoes",
      roles: ['admin']
    },
    {
      icon: User,
      label: "Perfil",
      path: "/profile",
      roles: ['admin', 'chefe_bar', 'bartender', 'montador', 'entregador']
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg pb-safe">
      <div className="flex items-center justify-around p-3 md:justify-center md:gap-8">
        {navItems
          .filter(item => !item.roles || (user && item.roles.includes(user.role as any)))
          .map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-all ${active
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-primary/70"
                  }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${active ? "bg-primary/20" : ""}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider hidden md:block">
                  {item.label}
                </span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}