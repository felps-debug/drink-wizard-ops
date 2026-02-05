# 🏗️ Documento de Arquitetura de Software: Mago dos Drinks

## 1. Visão Geral
Este documento descreve a infraestrutura técnica e as decisões de design para o sistema de gestão da Mago dos Drinks. O sistema será uma aplicação **Web Fullstack Responsiva** (PWA), priorizando a facilidade de uso em dispositivos móveis e a integridade dos cálculos financeiros.

## 2. Pilha de Tecnologia (Tech Stack)
| Camada               | Tecnologia               | Justificativa                                                                 |
| :------------------- | :----------------------- | :---------------------------------------------------------------------------- |
| **Frontend** | React (Next.js)          | Renderização rápida e facilidade para criar uma interface mobile-first.       |
| **Backend** | Node.js (API Routes)     | Escalabilidade e execução eficiente de lógica de negócios e integrações.      |
| **Banco de Dados** | PostgreSQL (Supabase)    | Banco relacional robusto para gerir o histórico de preços e checklists.       |
| **Autenticação** | Supabase Auth            | Gestão segura de níveis de acesso (Admin vs. Equipe).                         |
| **Notificações** | Evolution API (WhatsApp) | Integração para automação de mensagens para clientes e equipe.                |
| **Hospedagem** | Vercel                   | Deploy contínuo e infraestrutura serverless de baixo custo.                   |

## 3. Modelo de Dados (Entidades Principais)
* **Users:** ID, nome, cargo (Admin, Chefe de Bar, Bartender, Montador), telefone.
* **Insumos:** ID, nome (ex: Vodka), unidade (ex: garrafa).
* **Historico_Precos:** ID, insumo_id, valor_custo, data_inicio_semana.
* **Eventos:** ID, cliente_nome, data_evento, valor_contrato, status (Agendado, Montagem, Em Curso, Finalizado).
* **Checklists:** ID, evento_id, tipo (Entrada/Saída), item_id, quantidade, conferido_por.
* **Custos_Operacionais:** ID, evento_id, categoria (Gasolina, Manutenção, Mão de Obra), valor.

## 4. Fluxo de Integração WhatsApp
1.  **Gatilho (Trigger):** Alteração de status do evento no Frontend.
2.  **Ação:** O Backend dispara um webhook para a Evolution API.
3.  **Resultado:** O cliente recebe: *"Mago dos Drinks informa: Sua festa em [Local] já está sendo preparada! 🍸"*

## 5. Regras de Negócio Técnicas
* **Cálculo de Lucro:** O sistema deve buscar o preço do insumo na tabela `Historico_Precos` correspondente à data do evento.
* **Sincronização Offline:** O checklist deve permitir preenchimento inicial mesmo com oscilação de sinal de internet, sincronizando ao detectar conexão.

## 6. Segurança
* **RLS (Row Level Security):** Filtros no banco de dados garantem que Bartenders vejam apenas suas escalas, enquanto o lucro é restrito ao Admin.
* **Criptografia:** Dados sensíveis e tokens de API armazenados em variáveis de ambiente protegidas.

---
*Documento gerado sob a metodologia BMAD-METHOD™*.