 import { ReactNode } from "react";
 import { Header } from "./Header";
 import { BottomNav } from "./BottomNav";
 
 interface AppLayoutProps {
   children: ReactNode;
   title?: string;
 }
 
 export function AppLayout({ children, title }: AppLayoutProps) {
   return (
    <div className="flex min-h-screen flex-col bg-background">
       <Header title={title} />
      <main className="flex-1 pb-20">{children}</main>
       <BottomNav />
     </div>
   );
 }