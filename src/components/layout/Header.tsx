 import { Bell, Menu, User } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { currentUser, getRoleLabel } from "@/lib/mock-data";
 
 interface HeaderProps {
   title?: string;
 }
 
 export function Header({ title = "Mago dos Drinks" }: HeaderProps) {
   return (
    <header className="header-gradient sticky top-0 z-40 border-b backdrop-blur-sm">
       <div className="flex h-14 items-center justify-between px-4">
         <div className="flex items-center gap-3">
           <span className="text-xl">🍸</span>
           <h1 className="text-lg font-semibold">{title}</h1>
         </div>
 
         <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="relative">
             <Bell className="h-5 w-5" />
             <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
               3
             </span>
           </Button>
 
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon">
                 <User className="h-5 w-5" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-56">
               <DropdownMenuLabel>
                 <div className="flex flex-col">
                   <span>{currentUser.name}</span>
                   <span className="text-xs font-normal text-muted-foreground">
                     {getRoleLabel(currentUser.role)}
                   </span>
                 </div>
               </DropdownMenuLabel>
               <DropdownMenuSeparator />
               <DropdownMenuItem>Meu Perfil</DropdownMenuItem>
               <DropdownMenuItem>Configurações</DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem className="text-destructive">
                 Sair
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
       </div>
     </header>
   );
 }