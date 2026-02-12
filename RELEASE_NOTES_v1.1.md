# Notas de Lançamento - Correção de Notificações e Bugs Críticos

Todas as correções solicitadas foram implementadas e enviadas para produção.

## 1. Notificações de WhatsApp
- **Problema:** Mensagens não chegavam mesmo com status "Sucesso" na UI.
- **Causa:** URL do serviço UAZAPI estava mal formatada nas Edge Functions (barra extra no final).
- **Correção:** Código ajustado em `whatsapp-notify` (envio manual) e `handle-automation` (checklists).
- **Deploy:** Ambas funções foram atualizadas no servidor Supabase.

## 2. Alocação de Profissionais
- **Problema:** Erro ao tentar realocar profissional previamente removido.
- **Correção:** Implementada lógica de `upsert` (atualização se existir, inserção se novo) no banco de dados. Agora é possível remover e adicionar o mesmo profissional livremente.

## 3. Visibilidade de Eventos
- **Problema:** Novos eventos não apareciam no topo da lista.
- **Correção:** Lista agora ordenada por data de CRIAÇÃO (mais recentes primeiro), garantindo que novos eventos sejam visíveis imediatamente.

## 4. Persistência de Pacotes
- **Problema:** Alterações nos itens do pacote não refletiam na hora.
- **Correção:** Cache do sistema agora é invalidado corretamente após edição, forçando atualização imediata dos dados.

## Próximos Passos
O sistema está estável. Pode testar o fluxo completo:
1. Criar Evento
2. Alocar Staff (verificar recebimento WhatsApp)
3. Preencher Checklist de Entrada (verificar notificação Cliente)

Qualquer dúvida, verifique os arquivos modificados ou logs do Supabase.
