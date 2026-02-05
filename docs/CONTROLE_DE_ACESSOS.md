# Controle de Acessos (RBAC) - Mago dos Drinks

Este documento define os níveis de acesso e permissões do sistema operacional "Mago dos Drinks". O sistema utiliza **Row Level Security (RLS)** no Supabase e componentes protegidos no Frontend.

## Hierarquia de Funções (Roles)

O sistema possui 4 níveis hierárquicos, definidos no type `user_role` do banco de dados:

1.  **ADMIN** (`admin`)
    *   **Permissão:** Total. Vê tudo, edita tudo, deleta tudo.
    *   **Exclusivo:** Pode ver valores financeiros, gerenciar equipe (convites), e deletar registros críticos.
    *   **Acesso:** Todas as páginas.

2.  **CHEFE DE BAR** (`chefe_bar`)
    *   **Permissão:** Gerencial Operacional.
    *   **Pode:** Gerenciar Estoque (Criar/Editar Insumos), Gerenciar Checklists, Ver Eventos.
    *   **Não Pode:** Ver Financeiro, Gerenciar Equipe (Convites).
    *   **Acesso:** Estoque, Eventos, Checklists.

3.  **BARTENDER** (`bartender`)
    *   **Permissão:** Operacional Padrão.
    *   **Pode:** Ver Eventos, Preencher Checklists (apenas atualização), Ver seu próprio Perfil.
    *   **Não Pode:** Gerenciar Estoque (Apenas visualização), Ver Financeiro.
    *   **Acesso:** Home, Eventos (Leitura), Checklists (Leitura/Update parcial).

4.  **MONTADOR** (`montador`)
    *   **Permissão:** Restrita.
    *   **Pode:** Ver Checklists de Entrada/Saída e realizar contagem.
    *   **Não Pode:** Ver lista completa de eventos detalhada (apenas o necessário), Ver Estoque Geral.
    *   **Acesso:** Checklists.

## Matriz de Permissões (Páginas)

| Página | Rota | Admin | Chefe de Bar | Bartender | Montador |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Dashboard** | `/` | ✅ | ✅ | ✅ | ⚠️ (Limitado) |
| **Eventos** | `/eventos` | ✅ | ✅ | ✅ | ❌ |
| **Estoque** | `/insumos` | ✅ | ✅ | 👁️ (Ver) | ❌ |
| **Equipe** | `/equipe` | ✅ (Edit) | 👁️ (Ver) | 👁️ (Ver) | ❌ |
| **Financeiro** | `/relatorios` | ✅ | ❌ | ❌ | ❌ |
| **Checklists** | `/checklist/*` | ✅ | ✅ | ✅ | ✅ |

## Fluxo de Entrada (Onboarding)

O sistema utiliza um modelo de **Convites Pré-Aprovados**:

1.  **Admin** gera um convite para `email@exemplo.com` com a função desejada (ex: `montador`).
2.  O registro é criado na tabela `team_invites`.
3.  Quando o usuário se cadastra no Supabase (Login/Registrar) com esse *mesmo email*:
    *   O sistema detecta o convite.
    *   Atribui automaticamente o cargo de `montador` ao invés do padrão `bartender`.
    *   Cria o perfil do usuário.

## Segurança Técnica

*   **Frontend:** Componente `<ProtectedRoute allowedRoles={['...']} />` bloqueia navegação.
*   **Backend:** Políticas RLS (Row Level Security) no PostgreSQL garantem que mesmo se o Frontend for burlado, a API recusa a entrega de dados sensíveis (ex: `financial_value` retorna `null` ou erro para não-admins).
