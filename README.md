# 🍸 Mago dos Drinks

Sistema completo de gestão operacional para empresas de bartending e eventos.

Plataforma web moderna que centraliza toda a operação: cadastro de clientes, criação de eventos, controle de estoque, escala de equipe, checklists de campo e notificações automáticas via WhatsApp.

<br>

## ✨ Visão Geral

O Mago dos Drinks resolve um problema real: a gestão manual e fragmentada de empresas que operam em eventos. Planilhas, mensagens soltas no WhatsApp e falta de controle são substituídos por uma plataforma única, acessível de qualquer dispositivo.

O sistema foi projetado para diferentes perfis de usuário, cada um com permissões e visões específicas da operação.

<br>

## 🧩 Features

### 📅 Gestão de Eventos
Criação de eventos com dados do cliente, local, data, valor do contrato e pacote de drinks. Cada evento possui um pipeline visual de status:

`Agendado → Montagem → Montado → Entregue → Em Curso → Finalizado`

O admin acompanha cada etapa em tempo real e transições de status podem disparar automações.

---

### 👥 Gestão de Equipe
Cadastro de profissionais com quatro perfis operacionais:

| Perfil | Função |
|--------|--------|
| Barman | Atua no evento servindo drinks |
| Chefe de Bar | Supervisiona a operação no local |
| Montador | Responsável pela montagem e desmontagem |
| Entregador | Realiza o transporte de equipamentos |

Cada profissional tem telefone, email e diária configurável. O sistema suporta convites por email que criam automaticamente a conta do profissional.

---

### 📊 Escala Operacional
Para cada evento, o admin monta a escala selecionando profissionais disponíveis. O sistema verifica automaticamente conflitos de data, impedindo que um profissional seja alocado em dois eventos no mesmo dia.

---

### 📱 Notificações WhatsApp
Ao alocar um profissional, o sistema envia uma notificação via WhatsApp com os dados do evento (nome, data, local). Normalização automática de números brasileiros e controle de reenvio.

---

### 📦 Pacotes de Drinks
Pacotes pré-configurados (ex: "Premium Gin", "Open Bar Clássico") com lista de ingredientes e quantidades. Ao vincular um pacote a um evento, o sistema já sabe quais insumos serão necessários.

---

### 🧪 Controle de Estoque
Cadastro de ingredientes com unidade de medida, categoria e estoque atual. Histórico de preços para acompanhar variações de custo.

---

### ✅ Checklists de Campo

| Tipo | Quando | Finalidade |
|------|--------|------------|
| Entrada | Antes do evento | Conferir o que foi levado ao local |
| Saída | Após o evento | Conferir o que retornou do local |

Registram quem conferiu e quando. A finalização de cada checklist pode transicionar automaticamente o status do evento.

---

### 🤖 Automações
Motor de automações configurável. Quando determinados eventos acontecem (ex: status muda para "finalizado"), o sistema pode disparar ações automáticas como envio de mensagem WhatsApp para o cliente, usando templates com variáveis dinâmicas.

---

### 📈 Relatórios
Dashboard com métricas operacionais: faturamento total, custo operacional, margem de lucro e distribuição de custos por categoria.

---

### 👤 Gestão de Clientes
Cadastro de clientes com nome, telefone, email e CPF/CNPJ. Histórico de eventos vinculados a cada cliente.

---

### 🔐 Controle de Acesso

| Perfil | Acesso |
|--------|--------|
| Admin | Acesso total ao sistema |
| Chefe de Bar | Eventos, insumos, clientes e checklists |
| Barman / Montador / Entregador | Eventos, escalas e perfil pessoal |

Autenticação com email/senha e Google OAuth.

<br>

## 🛠️ Stack

### Frontend

| Tecnologia | Uso |
|------------|-----|
| React 18 | Interface de usuário |
| TypeScript | Tipagem estática |
| Vite | Build tool e dev server |
| React Router v6 | Roteamento SPA |
| TanStack React Query | Cache e estado do servidor |
| Shadcn/UI + Radix UI | Componentes acessíveis |
| Tailwind CSS | Estilização |
| Recharts | Gráficos |

### Backend

| Tecnologia | Uso |
|------------|-----|
| Supabase | BaaS (Database, Auth, Edge Functions) |
| PostgreSQL | Banco de dados relacional |
| Row Level Security | Controle de acesso por linha |
| Edge Functions (Deno) | Lógica serverless |

<br>

## 🏗️ Arquitetura

```
src/
├── components/         # Componentes reutilizáveis
│   ├── ui/             # 49 componentes Shadcn/UI
│   ├── layout/         # AppLayout, Sidebar, BottomNav
│   ├── events/         # Escala e Checklists
│   └── auth/           # ProtectedRoute
├── pages/              # 20 páginas
├── hooks/              # 14 custom hooks
├── context/            # Autenticação global
├── services/           # WhatsApp service
└── lib/                # Utilitários e tipos

supabase/functions/
├── invite-agent/       # Criação de usuários
├── whatsapp-notify/    # Notificações WhatsApp
└── handle-automation/  # Motor de automações
```

<br>

## 🗃️ Modelo de Dados

| Tabela | Descrição |
|--------|-----------|
| profiles | Perfis de usuário com role e permissões |
| events | Eventos com status, pacote e cliente |
| clients | Cadastro de clientes |
| magodosdrinks_staff | Equipe operacional |
| magodosdrinks_allocations | Escalas (staff ↔ evento) |
| magodosdrinks_packages | Pacotes de drinks |
| ingredients | Insumos e estoque |
| checklists | Checklists de entrada e saída |
| operational_costs | Custos operacionais por evento |
| staff_availability | Disponibilidade da equipe |
| automation_triggers | Regras de automação |

<br>

## 🚀 Como Rodar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Rodar em desenvolvimento
npm run dev
```

<br>

## 📸 Destaques Técnicos

🔹 14 Custom Hooks com React Query para cache inteligente e mutations otimistas

🔹 3 Edge Functions serverless em Deno para lógica de backend

🔹 Row Level Security em todas as tabelas

🔹 Pipeline de eventos com transições que disparam automações

🔹 Normalização de telefone brasileira com suporte a múltiplos formatos

🔹 Design system com tema dark, UI responsiva e mobile-first
