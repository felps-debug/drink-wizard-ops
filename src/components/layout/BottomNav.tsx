import { Home, Calendar, Package, Users, BarChart3, Zap, LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/mock-data";

interface NavItem {
  icon: LucideIcon;
  name: string;
  path: string;
  roles?: UserRole[] | ["*"];
}

const navItems: NavItem[] = [
  { icon: Home, name: "Início", path: "/", roles: ["*"] },
  { icon: Calendar, name: "Eventos", path: "/eventos", roles: ["*"] },
  { 
    icon: Package, 
    name: "Insumos", 
    path: "/insumos",
    roles: ['admin', 'chefe_bar']
  },
  { icon: Users, name: "Equipe", path: "/equipe", roles: ["admin"] },
  { 
    icon: BarChart3, 
    name: "Relatórios", 
    path: "/relatorios",
    roles: ['admin']
  },
  { icon: Zap, name: "Automações", path: "/automacoes", roles: ["admin"] },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const filteredItems = navItems.filter(item => {
    if (!item.roles || item.roles.includes("*" as any)) return true;
    return user && item.roles.includes(user.role);
  });

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-white/20 bg-background/80 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className={cn(isActive && "font-medium")}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}