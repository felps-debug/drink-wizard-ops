 import { ReactNode } from "react";
 import { Header } from "./Header";
 import { BottomNav } from "./BottomNav";
 
 interface AppLayoutProps {
   children: ReactNode;
   title?: string;
 }
 
 export function AppLayout({ children, title }: AppLayoutProps) {
   return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Gradient background effect */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, #FFCDD2 0%, #E57373 30%, transparent 70%)',
        }}
      />
       <Header title={title} />
      <main className="relative z-10 flex-1 pb-20">{children}</main>
       <BottomNav />
     </div>
   );
 }