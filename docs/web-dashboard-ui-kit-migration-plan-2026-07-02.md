# Web Dashboard Migration Plan (UI Kit + Real Data)

Date: 2026-07-02
Scope: apps/web dashboard and inspections module.

## Executive Decision

Recommended approach: hybrid.

- Keep the current dashboard visual layout intact while finishing real-data wiring in place.
- Start UI-kit migration immediately, but as a parallel track with a strangler pattern (new components behind parity checks), not a big-bang rewrite.

Why:

1. The current dashboard route uses a giant Figma-exported file (`apps/web/src/modules/dashboard/DashboardPage.tsx`).
2. The reference project under `docs/references/aurelia-web` does include a UI kit, but its dashboard import files are also large Figma exports (`src/imports/DashboardInspecciones/index.tsx`, `src/imports/DashboardInspecciones-1/index.tsx`).
3. Full immediate migration to a clean UI-kit architecture would require framework alignment work first (tailwind/shadcn/recharts setup and design-token consolidation), which is high-risk if done together with data integration.

## Current Findings (Audit)

### apps/web (current production app)

- Dashboard screen is a monolithic generated file: `apps/web/src/modules/dashboard/DashboardPage.tsx`.
- No local UI-kit component library currently used in this app (`apps/web/src/app/components/ui` does not exist).
- Existing infra for real data already available:
  - `useInspectionDashboardSummary` hook.
  - `listInspections` and `getInspectionDashboardSummary` service methods.

### docs/references/aurelia-web (reference)

- Has a broad UI component library under `src/app/components/ui`.
- Also contains giant Figma-exported dashboard screens under `src/imports/*`.
- Includes chart-heavy handcrafted app file (`src/app/App.tsx`) that is not directly drop-in compatible with current `apps/web` stack.

Conclusion: reference is useful as style/component source, but not as direct copy-paste replacement.

## Delivery Strategy

### Track A: Real Data First (No Visual Regression)

Goal: Finish backend-driven behavior while preserving exact screen structure.

Iteration A1 (done):
- Dynamic runtime values injected in existing dashboard file for KPI and alert chips.

Iteration A2 (next):
- Replace static detail table rows with real inspection/finding data mapped into existing table structure.
- Keep exact visual hierarchy and column layout.

Iteration A3:
- Wire chart datasets from real backend aggregates where contracts already exist.
- For missing aggregates, add API + contracts incrementally with backward compatibility.

### Track B: UI Kit Migration (Parallel, Controlled)

Goal: Move from giant generated page to maintainable component architecture.

Iteration B1 (start now):
- Define target component boundaries in `apps/web/src/modules/dashboard/components/`:
  - `DashboardTopKpis`
  - `DashboardAlertsStrip`
  - `DashboardOpenFindingsTable`
  - `DashboardChartsBlock`
  - `DashboardCompanyAnalysisBlock`
- Keep current route rendering old screen until visual parity tests pass.

Iteration B2:
- Extract one block at a time from giant page into typed components.
- Keep same markup classes/tokens and snapshots to avoid visual drift.

Iteration B3:
- Introduce a small local UI-kit layer in current app (not full framework migration):
  - primitives only (`Card`, `Badge`, `Table`, `SectionHeader`, `StatTile`).
- Map these primitives to existing styles first; do not redesign.

Iteration B4:
- Optional framework convergence with reference stack (tailwind/shadcn/recharts) if still desired.
- Execute only after Track A and B2 are stable.

## Risk Register

1. Big-bang migration risk: high.
- Mitigation: strangler pattern, component-by-component extraction.

2. Visual regression risk: high.
- Mitigation: side-by-side screenshot checks and strict parity acceptance criteria.

3. Contract drift risk: medium.
- Mitigation: API changes only through `packages/contracts` first, then web service/hook usage.

4. Time-to-value risk if architecture refactor starts too wide: high.
- Mitigation: continue real-data integration in existing view while extracting blocks in parallel.

## Acceptance Criteria

1. Existing dashboard visual structure remains unchanged for users.
2. KPI, alerts, table, and charts show real backend data.
3. Every new API aggregate has matching types in `packages/contracts`.
4. Extracted components are typed, reusable, and covered by smoke tests.
5. Giant file size reduced incrementally with no route-level breakage.

## Immediate Next Action

Proceed with Iteration A2:
- Inject real rows into the existing "Detalle de observaciones abiertas" table, preserving current layout.
- Start B1 skeleton component boundaries in parallel (no route switch yet).
