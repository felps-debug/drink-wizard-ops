 import { Home, Calendar, Package, Users, BarChart3 } from "lucide-react";
 import { Link, useLocation } from "react-router-dom";
 import { cn } from "@/lib/utils";
 
 const navItems = [
   { icon: Home, label: "Início", path: "/" },
   { icon: Calendar, label: "Eventos", path: "/eventos" },
   { icon: Package, label: "Insumos", path: "/insumos" },
   { icon: Users, label: "Equipe", path: "/equipe" },
   { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
 ];
 
 export function BottomNav() {
   const location = useLocation();
 
   return (
    <nav className="header-gradient fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-sm safe-area-bottom">
       <div className="flex items-center justify-around py-2">
         {navItems.map((item) => {
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
               <span className={cn(isActive && "font-medium")}>{item.label}</span>
             </Link>
           );
         })}
       </div>
     </nav>
   );
 }