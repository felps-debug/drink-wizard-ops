

# Plano: Página de Detalhes do Evento com Checklist

## O que será criado

### 1. Nova página: `src/pages/EventoDetalhe.tsx`
- Exibe dados do evento (cliente, telefone, local, data, valor)
- Tabs: "Checklist Entrada" e "Checklist Saída"
- Lista de insumos com quantidade enviada/retornada
- Cálculo automático de consumo real
- Registro de quem conferiu

### 2. Nova rota no `App.tsx`
```text
/eventos/:id → EventoDetalhe
```

### 3. Mock data adicional
- Adicionar `checklistItems` de exemplo no `mock-data.ts`

## Estrutura da Interface

```text
┌─────────────────────────────────┐
│ ← Voltar     Casamento Silva    │
├─────────────────────────────────┤
│ 📍 Espaço Villa Garden          │
│ 📞 (11) 99999-1111              │
│ 📅 15/02/2026    💰 R$ 8.500    │
├─────────────────────────────────┤
│  [Entrada]  [Saída]             │
├─────────────────────────────────┤
│ ☑ Vodka Absolut                 │
│   Saída: 10  │  Retorno: 3      │
│   Consumo: 7                    │
├─────────────────────────────────┤
│ ☑ Gelo (saco 5kg)               │
│   Saída: 5   │  Retorno: 0      │
│   Consumo: 5                    │
└─────────────────────────────────┘
```

## Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/pages/EventoDetalhe.tsx` | Criar |
| `src/App.tsx` | Adicionar rota |
| `src/lib/mock-data.ts` | Adicionar dados de checklist |

