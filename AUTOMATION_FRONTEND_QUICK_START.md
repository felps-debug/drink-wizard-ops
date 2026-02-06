# Automation System Frontend - Quick Start Guide

## Overview
The automation frontend is now fully implemented and ready for integration with the backend. All components follow neo-brutalism styling and Portuguese localization.

## Key Files

### Hooks
- **`src/hooks/useVariableSubstitution.ts`** - Variable substitution logic
  ```typescript
  import { useVariableSubstitution, validateVariables, substituteVariables } from '@/hooks/useVariableSubstitution'
  ```

- **`src/hooks/useAutomations.ts`** - API calls to automation_triggers table
  ```typescript
  import { useAutomations, AutomationTrigger } from '@/hooks/useAutomations'
  ```

### Components
- **`src/components/automations/AutomationCard.tsx`** - Display single automation
- **`src/components/automations/AutomationForm.tsx`** - Reusable form logic
- **`src/components/automations/AutomationDialog.tsx`** - Create dialog wrapper
- **`src/pages/Automacoes.tsx`** - Main page (refactored)

## Usage Examples

### Import Components
```typescript
import { AutomationDialog } from '@/components/automations/AutomationDialog'
import { AutomationCard } from '@/components/automations/AutomationCard'
import { useAutomations } from '@/hooks/useAutomations'
```

### Use Automation Hook
```typescript
const { automations, isLoading, createAutomation, toggleAutomation, deleteAutomation } = useAutomations()

// Create automation
await createAutomation.mutateAsync({
  name: 'My Automation',
  trigger_event: 'checklist_entrada',
  action_type: 'whatsapp',
  action_config: {
    message: 'Olá {cliente}, bem-vindo!'
  },
  active: true
})

// Toggle automation
toggleAutomation.mutate({ id: 'automation-id', active: true })

// Delete automation
deleteAutomation.mutate('automation-id')
```

### Validate Variables
```typescript
import { validateVariables, substituteVariables } from '@/hooks/useVariableSubstitution'

const validation = validateVariables('Olá {cliente}, data {data}')
if (!validation.valid) {
  console.error(validation.errors) // Array of error strings
}

// Substitute variables
const message = substituteVariables(
  'Olá {cliente}, seu evento em {local} está em {data}',
  {
    client_name: 'João',
    event_location: 'Copacabana',
    event_date: '2026-02-15'
  }
)
// Result: "Olá João, seu evento em Copacabana está em 15/02/2026"
```

## Available Variables

### Client Variables
- `{cliente}` or `{client_name}` - Client name
- `{email}` or `{client_email}` - Client email
- `{phone}` or `{client_phone}` - Client phone

### Event Variables
- `{data}` or `{date}` - Event date (formatted to pt-BR: DD/MM/YYYY)
- `{local}` or `{location}` - Event location
- `{event_name}` - Event name

### Staff Variables
- `{nome}` or `{nome_staff}` - Staff member name
- `{staff_role}` - Staff member role

## Required Database Schema

The `automation_triggers` table must exist with this structure:

```sql
create table public.automation_triggers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id),
  name text not null,
  description text,
  active boolean default true,
  trigger_event text not null, -- 'checklist_entrada', 'checklist_saida', 'event_created'
  trigger_conditions jsonb,
  action_type text default 'whatsapp', -- 'whatsapp', 'email'
  action_config jsonb not null, -- { "message": "...", "delay_seconds": 0 }
  last_triggered_at timestamp with time zone,
  trigger_count integer default 0
);
```

## Trigger Events

Supported trigger event values:

| Value | Label | Trigger Condition |
|-------|-------|------------------|
| `checklist_entrada` | Checklist Entrada Concluído | When entry checklist is completed |
| `checklist_saida` | Checklist Saída Concluído | When exit checklist is completed |
| `event_created` | Novo Evento Agendado | When new event is created |

## TypeScript Interfaces

### AutomationTrigger
```typescript
interface AutomationTrigger {
  id: string
  name: string
  description?: string
  active: boolean
  trigger_event: string
  trigger_conditions?: Record<string, any>
  action_type: string
  action_config: {
    message: string
    phone_source?: string
    delay_seconds?: number
    max_retries?: number
  }
  last_triggered_at?: string
  trigger_count?: number
  created_at?: string
  updated_at?: string
  created_by?: string
}
```

### Validation Result
```typescript
interface ValidationResult {
  valid: boolean
  errors: string[]
  variables: string[] // Variables found in template
}
```

## Styling Reference

### Neo-Brutalism Elements
- **Borders**: 2-3px solid, `border-white/10` or `border-primary`
- **Shadows**: Hard shadows like `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- **Corners**: Always `rounded-none`
- **Hover Effects**: Color shift to primary, slight shadow reduction

### Colors
- **Primary**: `#7C3AED` (Purple) - Main actions
- **Secondary**: `#A78BFA` (Light Purple) - Secondary text
- **CTA**: `#F97316` (Orange) - Accent
- **Background**: `#FAF5FF` - Light backgrounds
- **Text**: `#4C1D95` - Primary text

### Font Classes
- **Mono**: `font-mono` - Labels and code (Fira Code)
- **Display**: `font-display` - Headings (Fira Code)
- **Normal**: Default - Body text (Fira Sans)

## Common Tasks

### Add Automation Button
```typescript
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

<Button
  onClick={() => setDialogOpen(true)}
  className="rounded-none border-2 border-primary bg-primary font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
>
  <Plus className="mr-2 h-4 w-4" /> Criar Gatilho
</Button>
```

### Display Automation Card
```typescript
import { AutomationCard } from '@/components/automations/AutomationCard'

<AutomationCard
  automation={automation}
  onToggle={(active) => toggleAutomation.mutate({ id: automation.id, active })}
  onDelete={() => deleteAutomation.mutate(automation.id)}
/>
```

### Create Automation Dialog
```typescript
import { AutomationDialog } from '@/components/automations/AutomationDialog'
import { useState } from 'react'

const [open, setOpen] = useState(false)

<AutomationDialog open={open} onOpenChange={setOpen} />
```

## Error Handling

All mutations include automatic error toasting via Sonner:
- Success: "AUTOMAÇÃO CRIADA!" (green toast)
- Error: "ERRO: [error message]" (red toast)

Error messages are automatically Portuguese (pt-BR).

## Accessibility

All components include:
- Proper `aria-label` attributes
- Keyboard navigation support
- Focus states visible
- Screen reader friendly labels
- Semantic HTML structure

## Testing

### Unit Test Example
```typescript
import { validateVariables, substituteVariables } from '@/hooks/useVariableSubstitution'

describe('Variable Substitution', () => {
  it('should substitute variables', () => {
    const result = substituteVariables(
      'Olá {cliente}',
      { client_name: 'João' }
    )
    expect(result).toBe('Olá João')
  })

  it('should validate variables', () => {
    const result = validateVariables('Olá {cliente}, {xyz}')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('xyz')
  })
})
```

## Performance Tips

1. **Use Query Caching**: useAutomations has 5-minute stale time
2. **Validate Early**: Form validation is in-component for instant feedback
3. **Memoize Callbacks**: PreviewVariableSubstitution uses useMemo
4. **Lazy Components**: Dialog only renders when needed

## Known Limitations

1. Max message length: 500 characters
2. Trigger events are fixed (only 3 supported)
3. Phone number resolution handled by Edge Functions
4. No multi-recipient support yet (future feature)

## Next Steps for Backend

1. Create `automation_triggers` table (see schema above)
2. Set up RLS policies (admin-only access)
3. Create/update Edge Functions:
   - `whatsapp-notify` - Send WhatsApp messages
   - `handle-automation` - Listen for triggers and execute
4. Configure webhooks on:
   - `event_checklists` table (update events)
   - `events` table (insert events)

## Troubleshooting

### Variables Not Being Substituted
- Check variable names are correct (pt-BR or English aliases)
- Validate with `validateVariables()`
- Check data object keys match expected field names

### Form Not Submitting
- Check all validation errors are resolved
- Ensure message contains valid variables only
- Verify name is 3-100 characters
- Check trigger_event is selected

### Components Not Rendering
- Ensure hooks are using `automation_triggers` table
- Check Supabase client is properly initialized
- Verify RLS policies allow access
- Check TypeScript compilation (zero errors)

## Support

For issues or questions:
1. Check TypeScript types for parameter requirements
2. Review examples in this guide
3. Check component prop interfaces
4. Verify database schema matches requirements
5. Test variable substitution independently
