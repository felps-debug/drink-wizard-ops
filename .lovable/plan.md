
# 🍸 Plano de Implementação: Mago dos Drinks

Sistema completo de gestão para empresa de bar de eventos, com foco em clareza financeira, controle operacional e interface mobile-first.

---

## 📱 Fase 1: Fundação e Autenticação

### Design System
- Interface **clean e minimalista** com cores neutras
- Totalmente **responsivo** e otimizado para celular
- Navegação simples com menu lateral ou bottom navigation

### Autenticação e Controle de Acesso
- Login seguro via Supabase Auth
- **4 níveis de acesso:**
  - **Admin** - Acesso total (lucros, custos fixos, relatórios)
  - **Chefe de Bar** - Eventos, checklists, escalas
  - **Bartender** - Sua escala e disponibilidade
  - **Montador** - Checklists de entrada/saída
- RLS (Row Level Security) para proteger dados sensíveis

---

## 📦 Fase 2: Gestão de Insumos e Preços

### Cadastro de Insumos
- Lista de todos os itens (bebidas, frutas, descartáveis, etc.)
- Unidade de medida (garrafa, kg, unidade)
- Categorização por tipo

### Histórico de Preços Semanais
- Atualização semanal dos preços de custo
- Histórico completo para cálculos precisos de lucratividade
- O sistema sempre usa o preço da semana do evento

---

## 🎉 Fase 3: Gestão de Eventos

### Cadastro de Eventos
- Informações do cliente (nome, telefone, local)
- Data do evento e valor do contrato
- Fluxo de status: **Agendado → Montagem → Em Curso → Finalizado**

### Custos Operacionais por Evento
- Registro de gastos (gasolina, manutenção, mão de obra extra)
- Vinculado a cada evento para cálculo real de lucro

---

## ✅ Fase 4: Checklists de Evento

### Checklist de Entrada (Montagem)
- Lista de materiais enviados para o evento
- Quantidade de cada insumo
- Registro de quem conferiu

### Checklist de Saída (Finalização)
- Contagem de sobras do evento
- Cálculo automático do **consumo real**
- Interface simples para uso rápido no local

---

## 📅 Fase 5: Escala de Bartenders

### Disponibilidade
- Bartenders informam seus dias disponíveis
- Visualização em calendário

### Gestão de Escalas
- Admin cria escalas para cada evento
- Atribuição de profissionais por evento
- Preparado para envio via WhatsApp (fase futura)

---

## 💰 Fase 6: Relatórios e Lucratividade

### Dashboard Financeiro (Admin Only)
- Visão geral de eventos e faturamento
- Lucro real por evento = Contrato - (Consumo Real + Custos Operacionais)

### Relatório de Lucratividade
- Margem de lucro por evento
- Comparativo de custos vs. receita
- Histórico de 6 meses para reajuste de pacotes

---

## 📲 Fase 7: Integração WhatsApp (Preparação)

### Estrutura Pronta
- Gatilhos de status preparados
- Mensagens configuráveis para cada status
- Quando você tiver a Evolution API configurada, a integração será simples

---

## 🔒 Segurança Implementada

- **RLS no banco de dados** - Cada cargo vê apenas o que pode
- **Dados financeiros protegidos** - Só Admin acessa lucros
- **Validação de inputs** - Proteção contra dados maliciosos
- **Secrets seguros** - Tokens armazenados em variáveis de ambiente

---

## 📊 Banco de Dados (Tabelas Principais)

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados básicos dos usuários |
| `user_roles` | Cargos (admin, chefe_bar, bartender, montador) |
| `insumos` | Cadastro de itens e unidades |
| `historico_precos` | Preços semanais de cada insumo |
| `eventos` | Eventos com status e valor de contrato |
| `checklists` | Itens de entrada/saída por evento |
| `custos_operacionais` | Gastos por evento (gasolina, etc.) |
| `escalas` | Atribuição de bartenders por evento |
| `disponibilidade` | Dias disponíveis de cada bartender |

---

## 🎯 Resultado Final

Um sistema completo que permite:
- ✅ Controle total de insumos e custos
- ✅ Gestão eficiente de eventos e equipe
- ✅ Checklists práticos para uso em campo
- ✅ Visibilidade clara da lucratividade real
- ✅ Base de dados para reajustes futuros
- ✅ Preparado para automação WhatsApp
