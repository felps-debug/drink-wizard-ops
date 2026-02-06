import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  validateVariables,
  previewVariableSubstitution,
  AVAILABLE_VARIABLES,
  Variable,
} from '@/hooks/useVariableSubstitution';
import { Copy, AlertCircle, CheckCircle } from 'lucide-react';

interface AutomationFormProps {
  onSubmit: (data: {
    name: string;
    trigger_event: string;
    message: string;
  }) => void;
  isLoading?: boolean;
}

const TRIGGER_EVENTS = [
  { value: 'checklist_entrada', label: 'Checklist Entrada Concluído' },
  { value: 'checklist_saida', label: 'Checklist Saída Concluído' },
  { value: 'event_created', label: 'Novo Evento Agendado' },
];

export function AutomationForm({ onSubmit, isLoading = false }: AutomationFormProps) {
  const [name, setName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('');
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Validate form fields
  const validation = useMemo(() => {
    const errors: string[] = [];

    if (name.length === 0) {
      errors.push('Digite um nome para a automação');
    } else if (name.length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    } else if (name.length > 100) {
      errors.push('Nome não pode exceder 100 caracteres');
    }

    if (!triggerEvent) {
      errors.push('Selecione um gatilho');
    }

    if (message.length === 0) {
      errors.push('Digite uma mensagem');
    } else if (message.length < 5) {
      errors.push('Mensagem deve ter pelo menos 5 caracteres');
    } else if (message.length > 500) {
      errors.push('Mensagem não pode exceder 500 caracteres');
    }

    // Validate variables in message
    const varValidation = validateVariables(message);
    if (!varValidation.valid) {
      errors.push(...varValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      characterCount: message.length,
    };
  }, [name, triggerEvent, message]);

  const isFormValid = validation.isValid && name && triggerEvent && message;
  const preview = showPreview ? previewVariableSubstitution(message) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit({
        name,
        trigger_event: triggerEvent,
        message,
      });
      // Reset form
      setName('');
      setTriggerEvent('');
      setMessage('');
      setShowPreview(false);
    }
  };

  const insertVariable = (variable: Variable) => {
    const textarea = document.querySelector('[data-automation-message]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage =
        message.substring(0, start) + `{${variable.key}}` + message.substring(end);
      setMessage(newMessage);
      // Restore cursor position after variable insertion
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.key.length + 2;
        textarea.focus();
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div className="space-y-2">
        <Label className="font-mono text-xs uppercase font-bold">Nome da Regra</Label>
        <Input
          placeholder="EX: Agradecimento Pós-Checklist"
          className="rounded-none border-2 border-white/20 bg-black/40 font-mono text-sm uppercase placeholder:text-muted-foreground/50 cursor-text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          aria-label="Nome da automação"
        />
        <p className="text-[10px] text-muted-foreground font-mono uppercase">
          {name.length}/100 caracteres
        </p>
      </div>

      {/* Trigger Event Select */}
      <div className="space-y-2">
        <Label className="font-mono text-xs uppercase font-bold">
          Quando Disparar? (Gatilho)
        </Label>
        <Select value={triggerEvent} onValueChange={setTriggerEvent}>
          <SelectTrigger className="rounded-none border-2 border-white/20 bg-black/40 font-mono text-sm uppercase cursor-pointer">
            <SelectValue placeholder="SELECIONE O EVENTO..." />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2 border-white/20 bg-black">
            {TRIGGER_EVENTS.map((event) => (
              <SelectItem key={event.value} value={event.value} className="uppercase cursor-pointer">
                {event.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Message Template */}
      <div className="space-y-2">
        <Label className="font-mono text-xs uppercase font-bold">
          Mensagem WhatsApp (Template)
        </Label>
        <Textarea
          data-automation-message
          placeholder="Olá {cliente}, seu checklist foi concluído!"
          className="rounded-none border-2 border-white/20 bg-black/40 font-mono text-sm h-32 placeholder:text-muted-foreground/50 resize-none cursor-text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          aria-label="Mensagem da automação"
        />
        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-muted-foreground">
          <span>{validation.characterCount}/500 caracteres</span>
          {validation.characterCount >= 450 && (
            <span className="text-orange-500">Limite próximo!</span>
          )}
        </div>
      </div>

      {/* Variable Hints */}
      <div className="rounded-none border border-white/10 bg-white/5 p-3 space-y-2">
        <p className="font-mono text-[10px] uppercase font-bold text-secondary">
          Variáveis Disponíveis
        </p>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(AVAILABLE_VARIABLES).map(([groupKey, variables]) => (
            <div key={groupKey} className="space-y-1">
              <p className="font-mono text-[9px] uppercase text-muted-foreground/70">
                {groupKey === 'client'
                  ? 'Cliente'
                  : groupKey === 'event'
                    ? 'Evento'
                    : 'Funcionário'}
              </p>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="group relative inline-flex items-center gap-1 rounded-none border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-[10px] uppercase text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 cursor-pointer"
                    title={variable.label}
                    aria-label={`Inserir variável ${variable.key}`}
                  >
                    <span>{`{${variable.key}}`}</span>
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="rounded-none border border-red-500/30 bg-red-500/5 p-3 space-y-1">
          {validation.errors.map((error, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="font-mono text-[10px] uppercase text-red-500">{error}</p>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {message && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="font-mono text-[10px] uppercase font-bold text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            {showPreview ? '- Ocultar Preview' : '+ Ver Preview'}
          </button>
          {preview && (
            <div className="rounded-none border border-green-500/30 bg-green-500/5 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <p className="font-mono text-xs text-green-500/80 italic leading-relaxed break-words">
                  {preview}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full h-12 rounded-none border-2 border-primary bg-primary font-mono text-sm font-bold uppercase text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[2px_2px_0px_0px_rgba(124,58,237,0.5)] transition-all duration-200 cursor-pointer"
        aria-label="Ativar automação"
      >
        {isLoading ? 'SALVANDO...' : 'ATIVAR AUTOMAÇÃO'}
      </Button>
    </form>
  );
}
