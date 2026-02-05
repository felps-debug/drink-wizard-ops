

# Plano: Refatoração do Módulo de Checklists (Conforme PRD)

## Problema Atual
A implementação atual usa tabs simples com checkboxes e inputs. O PRD exige um fluxo diferente com dashboard de botões, controles +/-, e regras de negócio específicas.

## Mudanças Necessárias

### 1. Estrutura de Dados (`mock-data.ts`)
Ajustar `ChecklistItem` para ter os campos do PRD:
- `qty_sent` (enviado pelo Admin)
- `qty_received` (confirmado na entrada)
- `qty_returned` (sobras na saída)
- `notes` (observações)
- `status` (pendente/conferido)

### 2. Dashboard do Evento (`EventoDetalhe.tsx`)
Transformar a tela atual em:
```
┌─────────────────────────────────┐
│ Casamento Silva                 │
│ 15/02/2026                      │
├─────────────────────────────────┤
│ [CHECKLIST ENTRADA]  ✓ Concluído│
│ [CHECKLIST SAÍDA]    ⏳ Pendente │
└─────────────────────────────────┘
```
- Botões grandes (mín 44x44px)
- AC1: Bloquear "Saída" até "Entrada" concluído

### 3. Tela Checklist Entrada (`ChecklistEntrada.tsx`)
Nova página com:
- Cards por item com botões `[-]` `[QTD]` `[+]`
- Comparar `qty_sent` vs `qty_received`
- AC2: Exigir justificativa se divergência
- Botão "Confirmar Entrada"

### 4. Tela Checklist Saída (`ChecklistSaida.tsx`)
Nova página com:
- Mesmos controles +/-
- Campo `qty_returned`
- Cálculo automático: `Consumo = qty_received - qty_returned`
- Botão "Salvar e Finalizar"
- AC4: Confirmação extra antes de enviar

### 5. Resumo de Encerramento
Modal ou tela mostrando:
- Total consumido por item
- AC3: Cálculo de custo baseado em preços

### 6. Rotas Novas (`App.tsx`)
```
/eventos/:id                → Dashboard
/eventos/:id/checklist-entrada → Entrada
/eventos/:id/checklist-saida   → Saída
```

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/lib/mock-data.ts` | Atualizar tipos |
| `src/pages/EventoDetalhe.tsx` | Refatorar para dashboard |
| `src/pages/ChecklistEntrada.tsx` | Criar |
| `src/pages/ChecklistSaida.tsx` | Criar |
| `src/App.tsx` | Adicionar rotas |

