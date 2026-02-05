 // Mock data for development without backend
 
 export type UserRole = "admin" | "chefe_bar" | "bartender" | "montador";
 
 export interface User {
   id: string;
   name: string;
   email: string;
   role: UserRole;
   phone?: string;
 }
 
 export interface Insumo {
   id: string;
   name: string;
   category: string;
   unit: string;
   currentPrice: number;
 }
 
 export interface Evento {
   id: string;
   clientName: string;
   clientPhone: string;
   location: string;
   date: string;
   contractValue: number;
   status: "agendado" | "montagem" | "em_curso" | "finalizado";
   createdAt: string;
 }
 
 export interface ChecklistItem {
   id: string;
   eventId: string;
   insumoId: string;
   insumoName: string;
   quantityOut: number;
   quantityBack: number | null;
   checkedBy: string | null;
 }
 
 export interface CustoOperacional {
   id: string;
   eventId: string;
   description: string;
   value: number;
   category: string;
 }
 
 export interface Escala {
   id: string;
   eventId: string;
   userId: string;
   userName: string;
   confirmed: boolean;
 }
 
 // Current logged user (mock)
 export const currentUser: User = {
   id: "1",
   name: "João Admin",
   email: "joao@magodosdrinks.com",
   role: "admin",
   phone: "(11) 99999-9999",
 };
 
 // Mock users
 export const users: User[] = [
   currentUser,
   { id: "2", name: "Maria Silva", email: "maria@magodosdrinks.com", role: "chefe_bar", phone: "(11) 98888-8888" },
   { id: "3", name: "Carlos Santos", email: "carlos@magodosdrinks.com", role: "bartender", phone: "(11) 97777-7777" },
   { id: "4", name: "Ana Costa", email: "ana@magodosdrinks.com", role: "bartender", phone: "(11) 96666-6666" },
   { id: "5", name: "Pedro Lima", email: "pedro@magodosdrinks.com", role: "montador", phone: "(11) 95555-5555" },
 ];
 
 // Mock insumos
 export const insumos: Insumo[] = [
   { id: "1", name: "Vodka Absolut", category: "Destilados", unit: "garrafa", currentPrice: 89.90 },
   { id: "2", name: "Whisky Jack Daniels", category: "Destilados", unit: "garrafa", currentPrice: 159.90 },
   { id: "3", name: "Gin Tanqueray", category: "Destilados", unit: "garrafa", currentPrice: 129.90 },
   { id: "4", name: "Rum Bacardi", category: "Destilados", unit: "garrafa", currentPrice: 59.90 },
   { id: "5", name: "Limão Siciliano", category: "Frutas", unit: "kg", currentPrice: 12.90 },
   { id: "6", name: "Limão Tahiti", category: "Frutas", unit: "kg", currentPrice: 8.90 },
   { id: "7", name: "Hortelã", category: "Frutas", unit: "maço", currentPrice: 4.50 },
   { id: "8", name: "Gelo", category: "Outros", unit: "saco 5kg", currentPrice: 15.00 },
   { id: "9", name: "Copo Descartável 300ml", category: "Descartáveis", unit: "pacote 100un", currentPrice: 18.90 },
   { id: "10", name: "Guardanapo", category: "Descartáveis", unit: "pacote 100un", currentPrice: 6.90 },
 ];
 
 // Mock eventos
 export const eventos: Evento[] = [
   {
     id: "1",
     clientName: "Casamento Silva",
     clientPhone: "(11) 99999-1111",
     location: "Espaço Villa Garden - SP",
     date: "2026-02-15",
     contractValue: 8500.00,
     status: "agendado",
     createdAt: "2026-01-20",
   },
   {
     id: "2",
     clientName: "Aniversário 50 anos - Roberto",
     clientPhone: "(11) 99999-2222",
     location: "Buffet Estrela - Campinas",
     date: "2026-02-08",
     contractValue: 4200.00,
     status: "montagem",
     createdAt: "2026-01-15",
   },
   {
     id: "3",
     clientName: "Formatura UNICAMP",
     clientPhone: "(11) 99999-3333",
     location: "Centro de Convenções - Campinas",
     date: "2026-02-05",
     contractValue: 12000.00,
     status: "em_curso",
     createdAt: "2026-01-10",
   },
   {
     id: "4",
     clientName: "Confraternização Empresa XYZ",
     clientPhone: "(11) 99999-4444",
     location: "Sede Empresa XYZ - SP",
     date: "2026-01-28",
     contractValue: 6800.00,
     status: "finalizado",
     createdAt: "2026-01-05",
   },
 ];
 
 // Mock custos operacionais
 export const custosOperacionais: CustoOperacional[] = [
   { id: "1", eventId: "4", description: "Gasolina ida/volta", value: 180.00, category: "Transporte" },
   { id: "2", eventId: "4", description: "Estacionamento", value: 40.00, category: "Transporte" },
   { id: "3", eventId: "4", description: "Manutenção bomba de drinks", value: 150.00, category: "Manutenção" },
 ];
 
 // Helper functions
 export const getStatusColor = (status: Evento["status"]) => {
   const colors = {
     agendado: "bg-secondary text-secondary-foreground",
     montagem: "bg-warning text-warning-foreground",
     em_curso: "bg-primary text-primary-foreground",
     finalizado: "bg-success text-success-foreground",
   };
   return colors[status];
 };
 
 export const getStatusLabel = (status: Evento["status"]) => {
   const labels = {
     agendado: "Agendado",
     montagem: "Montagem",
     em_curso: "Em Curso",
     finalizado: "Finalizado",
   };
   return labels[status];
 };
 
 export const getRoleLabel = (role: UserRole) => {
   const labels = {
     admin: "Administrador",
     chefe_bar: "Chefe de Bar",
     bartender: "Bartender",
     montador: "Montador",
   };
   return labels[role];
 };
 
 export const formatCurrency = (value: number) => {
   return new Intl.NumberFormat("pt-BR", {
     style: "currency",
     currency: "BRL",
   }).format(value);
 };
 
 export const formatDate = (dateString: string) => {
   return new Date(dateString).toLocaleDateString("pt-BR", {
     day: "2-digit",
     month: "2-digit",
     year: "numeric",
   });
 };