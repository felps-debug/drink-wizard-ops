-- SEED DATA SCRIPT
-- Limpa dados existentes para evitar duplicatas (CUIDADO: APAGA TUDO)
TRUNCATE public.event_checklists, public.events, public.ingredients, public.team_invites CASCADE;

-- 1. SEED INSUMOS (Inventário Inicial)
INSERT INTO public.ingredients (name, unit, category, min_stock, current_price) VALUES
('Vodka Absolut', 'garrafa', 'destilados', 12, 85.00),
('Gin Beefeater', 'garrafa', 'destilados', 10, 95.00),
('Whisky Red Label', 'garrafa', 'destilados', 5, 110.00),
('Rum Carta Branca', 'garrafa', 'destilados', 6, 60.00),
('Tequila Prata', 'garrafa', 'destilados', 4, 120.00),
('Aperol', 'garrafa', 'licores', 8, 75.00),
('Campari', 'garrafa', 'licores', 6, 80.00),
('Xarope de Açúcar', 'litro', 'xaropes', 10, 15.00),
('Xarope de Gengibre', 'litro', 'xaropes', 5, 25.00),
('Limão Taiti', 'kg', 'frutas', 20, 8.00),
('Limão Siciliano', 'kg', 'frutas', 10, 15.00),
('Laranja Bahia', 'kg', 'frutas', 15, 6.00),
('Hortelã', 'maço', 'guarnicoes', 10, 5.00),
('Gelo Cubo', 'saco', 'gelo', 50, 12.00),
('Gelo Britado', 'saco', 'gelo', 20, 15.00),
('Copo Long Drink', 'unidade', 'descartaveis', 500, 0.50),
('Canudo Biodegradável', 'pacote', 'descartaveis', 10, 25.00);

-- 2. SEED EVENTOS
INSERT INTO public.events (client_name, date, location, status, financial_value) VALUES
('Casamento Silva & Souza', NOW() + INTERVAL '5 days', 'Espaço Jardins', 'agendado', 15000.00),
('Aniversário 15 anos Julia', NOW() + INTERVAL '12 days', 'Salão Nobre', 'agendado', 8500.00),
('Corporate Tech Summit', NOW() - INTERVAL '2 days', 'Expo Center', 'finalizado', 45000.00),
('Despedida de Solteiro João', NOW() + INTERVAL '1 month', 'Chácara Recanto', 'agendado', 4000.00),
('Festival de Verão', NOW() + INTERVAL '3 days', 'Praia Club', 'em_curso', 25000.00);

-- 3. SEED CONVITES DE EQUIPE (Para Teste de Roles)
-- Crie usuários com estes emails para testar as permissões
INSERT INTO public.team_invites (email, role) VALUES
('admin@mago.com', 'admin'),
('chefe@mago.com', 'chefe_bar'),
('bartender@mago.com', 'bartender'),
('montador@mago.com', 'montador'),
('financeiro@mago.com', 'admin');

-- 4. Instruções (Comentário)
-- Para "Ativar" esses usuários, vá na tela de Login do App e crie contas (Sign Up) 
-- usando exatamente esses e-mails. A senha pode ser qualquer uma (ex: 123456).
