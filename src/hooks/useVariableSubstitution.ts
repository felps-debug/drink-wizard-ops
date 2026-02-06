// Variable substitution hook for automation message templates
// Supports client, event, and staff variables

export interface Variable {
  key: string;
  label: string;
  alias?: string;
}

export interface VariableGroup {
  [key: string]: Variable[];
}

export const AVAILABLE_VARIABLES: VariableGroup = {
  client: [
    { key: 'cliente', label: 'Nome do Cliente', alias: 'client_name' },
    { key: 'email', label: 'Email do Cliente', alias: 'client_email' },
    { key: 'phone', label: 'Telefone do Cliente', alias: 'client_phone' }
  ],
  event: [
    { key: 'data', label: 'Data do Evento', alias: 'date' },
    { key: 'local', label: 'Local do Evento', alias: 'location' },
    { key: 'event_name', label: 'Nome do Evento', alias: 'event_name' }
  ],
  staff: [
    { key: 'nome', label: 'Nome do Funcionário', alias: 'staff_name' },
    { key: 'staff_role', label: 'Cargo do Funcionário', alias: 'staff_role' }
  ]
};

/**
 * Get all available variable keys for validation
 */
export function getAllVariableKeys(): string[] {
  return Object.values(AVAILABLE_VARIABLES)
    .flatMap(group => [
      ...group.map(v => v.key),
      ...(group.map(v => v.alias).filter(Boolean) as string[])
    ]);
}

/**
 * Substitute variables in a message template with actual data
 * Handles client, event, and staff variables
 * Formats dates to pt-BR locale
 */
export function substituteVariables(
  template: string,
  data: Record<string, any>
): string {
  let result = template;

  // Client variables
  result = result
    .replace(/{cliente}/g, data.client_name || '')
    .replace(/{client_name}/g, data.client_name || '')
    .replace(/{email}/g, data.client_email || '')
    .replace(/{client_email}/g, data.client_email || '')
    .replace(/{phone}/g, data.client_phone || '')
    .replace(/{client_phone}/g, data.client_phone || '');

  // Event variables with date formatting
  const formattedDate = data.event_date
    ? new Date(data.event_date).toLocaleDateString('pt-BR')
    : '';

  result = result
    .replace(/{data}/g, formattedDate)
    .replace(/{date}/g, formattedDate)
    .replace(/{local}/g, data.event_location || '')
    .replace(/{location}/g, data.event_location || '')
    .replace(/{event_name}/g, data.event_name || '');

  // Staff variables
  result = result
    .replace(/{nome}/g, data.staff_name || '')
    .replace(/{nome_staff}/g, data.staff_name || '')
    .replace(/{staff_role}/g, data.staff_role || '');

  // Custom variables (any other data passed in)
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' || typeof value === 'number') {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
  }

  return result;
}

/**
 * Validate that all variables used in template are valid
 * Returns validation result with any errors found
 */
export function validateVariables(template: string): {
  valid: boolean;
  errors: string[];
  variables: string[];
} {
  const errors: string[] = [];
  const variables: string[] = [];
  const regex = /{(\w+)}/g;
  const matches = Array.from(template.matchAll(regex));
  const validKeys = getAllVariableKeys();

  const foundVariables = new Set<string>();
  for (const match of matches) {
    const variable = match[1];
    foundVariables.add(variable);

    if (!validKeys.includes(variable)) {
      errors.push(`Variável inválida: {${variable}}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    variables: Array.from(foundVariables)
  };
}

/**
 * Format a template message with sample data for preview
 * Useful for showing users what the final message will look like
 */
export function previewVariableSubstitution(template: string): string {
  const sampleData = {
    client_name: 'João Silva',
    client_email: 'joao@example.com',
    client_phone: '(11) 98765-4321',
    event_date: new Date().toISOString(),
    event_location: 'Salão de Festas Centro',
    event_name: 'Casamento de Maria e João',
    staff_name: 'Mário',
    staff_role: 'Gerente de Eventos'
  };

  return substituteVariables(template, sampleData);
}

/**
 * Get a formatted hint text showing all available variables
 */
export function getVariableHints(): string {
  const hints: string[] = [];

  for (const [group, variables] of Object.entries(AVAILABLE_VARIABLES)) {
    const varTexts = variables.map(v => `{${v.key}}`).join(', ');
    const groupLabel = group === 'client' ? 'CLIENTE' :
                      group === 'event' ? 'EVENTO' :
                      'STAFF';
    hints.push(`${groupLabel}: ${varTexts}`);
  }

  return hints.join('\n');
}

/**
 * Hook for using variable substitution in components
 */
export function useVariableSubstitution() {
  return {
    AVAILABLE_VARIABLES,
    substituteVariables,
    validateVariables,
    previewVariableSubstitution,
    getVariableHints,
    getAllVariableKeys
  };
}
