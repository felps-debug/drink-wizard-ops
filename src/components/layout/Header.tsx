import { Bell, Menu, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRoleLabel } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Mago dos Drinks" }: HeaderProps) {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-background/95 backdrop-blur-md transition-colors duration-300">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🍸</span>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-foreground" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name} 
                        className="h-6 w-6 rounded-full" 
                      />
                    ) : (
                      <User className="h-5 w-5 text-foreground" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Meu Perfil</DropdownMenuItem>
                  <DropdownMenuItem>Configurações</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive cursor-pointer"
                    onClick={signOut}
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={signInWithGoogle} variant="outline" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden md:inline">Entrar</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}