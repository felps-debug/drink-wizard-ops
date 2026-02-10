# Changelog

## [Unreleased]
### Fixed
- **Login Persistence**: Removed hardcoded admin email in `AuthContext.tsx`. Roles now derived from DB `cargo` field.
- **Auth Loading Hang**: Complete rewrite of `AuthContext.tsx` — uses `getSession()` for init + `onAuthStateChange` for future events. Removed `fetchingRef` guard that caused race conditions. Added auto-upsert for missing profiles.
- **Login Button Hang**: `signInWithEmail` now builds user immediately after `signInWithPassword` success. `handleLogin` navigates directly to dashboard instead of relying on `useEffect` watching auth state. Eliminates "ENTRANDO..." stuck state.
- **Email Confirmation**: Required disabling "Confirm email" in Supabase Auth settings for operational app.
- **Checklist Automation**: `saveChecklist` now auto-transitions event status (entrada→em_curso, saída→finalizado) and fires `handle-automation` edge function with correct event data for WhatsApp templates.
- **WhatsApp Allocation**: `useAllocations.ts` now sends WhatsApp to actual staff phone with event details (was hardcoded to a single number).

### Added
- **Event Workflow Pipeline**: Visual pipeline in `EventoDetalhe.tsx` showing full flow: Agendado → Montagem → Entregue → Em Curso → Finalizado.
- **Montador/Entregador Actions**: "Montagem Finalizada" and "Entrega Confirmada" buttons with automation triggers on status transition.
- **`entregue` Status**: New event status between montagem and em_curso for delivery confirmation.
- **`updateEventStatus` Mutation**: New mutation in `useEvent` hook for status transitions with optional automation firing.

### Auth & Security
- Addressed auth persistence issues:
    - Increased `ProtectedRoute` timeout from 3s to 10s.
    - Added retry logic to `AuthContext` profile loading.
    - Added fallback to `getUser()` in `AuthContext` initialization to recover sessions even if `getSession()` returns empty.
    - **CRITICAL FIX**: Rewrote `AuthContext` to include explicit 5s/10s safety timeouts on all Supabase operations (`signIn`, `getSession`, `getUser`, `profile`). This prevents "infinite loading" loops caused by network/storage hangs.
- Implemented **Logout** functionality in Profile page.

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
