# Changelog

## [Unreleased]
### Fixed
- **Login Persistence**: Removed hardcoded admin email in `AuthContext.tsx`. Roles now derived from DB `cargo` field.
- **Auth Loading Hang**: Rewrote auth initialization — uses `onAuthStateChange` as single source of truth with `useRef` guard and 8s safety timeout. Fixes "Verificando Credenciais" hanging forever on F5.
- **Login Button Hang**: Fixed `Login.tsx` handleLogin not resetting local loading state on success — button stuck on "Entrando..." forever.
- **Checklist Automation**: `saveChecklist` now auto-transitions event status (entrada→em_curso, saída→finalizado) and fires `handle-automation` edge function with correct event data for WhatsApp templates.
- **WhatsApp Allocation**: `useAllocations.ts` now sends WhatsApp to actual staff phone with event details (was hardcoded to a single number).

### Added
- **Event Workflow Pipeline**: Visual pipeline in `EventoDetalhe.tsx` showing full flow: Agendado → Montagem → Entregue → Em Curso → Finalizado.
- **Montador/Entregador Actions**: "Montagem Finalizada" and "Entrega Confirmada" buttons with automation triggers on status transition.
- **`entregue` Status**: New event status between montagem and em_curso for delivery confirmation.
- **`updateEventStatus` Mutation**: New mutation in `useEvent` hook for status transitions with optional automation firing.

### Changed
- **Escalas (Staff Scheduling)**: Complete rewrite with monthly availability calendar for bartenders and admin scheduling panel (select event → view available staff → one-click allocate).

- Added `PRD.md` and `architecture.md` documentation.
- Implemented new custom hooks for state and data management: `useAllocations`, `useAssignments`, `useOperationalCosts`, `usePackages`, and `useStaff`.
- Created new pages: `Escalas` (Staff Scheduling), `Pacotes` (Event Packages), and `Profile` (User Settings).
- Refactored and enhanced existing pages: `Eventos`, `Insumos`, `NovoEvento`, and `Relatorios`.
- Added new event-related components in `src/components/events/`.
- Introduced service layer in `src/services/` for API abstractions.
- Added Supabase database migrations and edge functions for backend logic.
- Updated project dependencies.

## [2026-02-06] - v0.1.0
- Initial changes and project structure setup.
