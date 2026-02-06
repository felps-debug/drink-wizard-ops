import { Home, Calendar, Package, Users, BarChart3, Zap, Map, User, LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/mock-data";

interface NavItem {
  icon: LucideIcon;
  name: string;
  path: string;
  roles: (UserRole | "*")[];
}

const navItems: NavItem[] = [
  { icon: Home, name: "Início", path: "/", roles: ["*"] },
  { icon: Calendar, name: "Eventos", path: "/eventos", roles: ["*"] },
  { icon: Users, name: "Equipe", path: "/equipe", roles: ["admin", "chefe_bar"] },
  { icon: Package, name: "Pacotes", path: "/pacotes", roles: ["admin"] },
  { icon: Map, name: "Escalas", path: "/escalas", roles: ["*"] },
  {
    icon: BarChart3,
    name: "Relatórios",
    path: "/relatorios",
    roles: ['admin']
  },
  { icon: User, name: "Perfil", path: "/profile", roles: ["*"] },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const filteredItems = navItems.filter(item => {
    if (item.roles.includes("*")) return true;
    return user && user.roles.some(role => item.roles.includes(role as any));
  });

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-white/20 bg-background/95 backdrop-blur-xl safe-area-bottom pb-1">
      <div className="flex items-center justify-around py-2">
        {filteredItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-[10px] uppercase transition-all duration-300",
                isActive
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-foreground hover:scale-105"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-lg p-1.5 transition-all",
                isActive ? "bg-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "bg-transparent"
              )}>
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              </div>
              <span className={cn(isActive ? "font-bold text-primary" : "font-medium")}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}