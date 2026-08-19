# Web Inspections Modal Wizard Plan

Date: 2026-07-03
Scope: replace iframe-based mobile embedding with native React DOM wizard in apps/web.

## Decision

Adopt native web modal flow inside apps/web and stop using iframe embedding of apps/mobile-inspecciones.

## Goals

- Open modal from Gestion de inspecciones when user clicks Nueva inspeccion.
- Implement equivalent wizard progressively in web:
  - start mode/type selection
  - identification
  - inspection type (Hallazgo / Checklist)
  - observations/checklist
  - summary
  - saved state
- Use existing web session token and backend endpoints.
- Reuse @aurelia/contracts types.
- Keep current management table and KPIs stable.

## Iteration Roadmap

### Iteration 1 (completed)

- Remove global iframe controller from app shell.
- Wire Nueva inspeccion button explicitly to open a web-native modal.
- Add modal shell component with initial start step and placeholder transition for next step.
- Keep UX non-breaking and isolated to inspections module.

Expected result:
- Button opens modal without iframe.
- No click interception at document level.
- Existing management table behavior unchanged.

### Iteration 2 (completed)

- Add wizard state store for step navigation and draft model (web local state, no offline).
- Implement Start + Identification steps UI in React DOM and wire from Gestion de inspecciones.
- Integrate real catalogs for areas and sectors.
- Integrate browser geolocation capture in identification.
- Keep observations and summary for next iterations.

### Iteration 3 (in progress)

- Implement inspection type split: (completed)
  - Hallazgo path
  - Checklist path
 - Assistant chatbot web flow: (in progress)
  - Start card now routes to a dedicated assistant chat step in web modal
  - Assistant step includes guided quick-intent selection and continue-to-wizard transition
    - Assistant step now preloads draft with real catalogs (area, sector), date and inspection type before moving to wizard
    - Assistant step now captures geolocation and applies smart continuation (identification/type/observations) based on unresolved data
      - Assistant step now supports path-specific prefill: finding type for hallazgo and checklist template selection before observations
      - Assistant step now uses bot/user bubble styling and includes local suggested severity/corrective measure for hallazgo path
        - Assistant chat goal selection now persists in flow store across modal navigation (back/forward within wizard)
        - Hallazgo suggestion can now be applied directly to draft, pre-filling first finding observation (condition/corrective/severity)
          - Assistant chat now shows persistent visual confirmation when hallazgo suggestion is applied
          - Assistant chat now persists a minimal interaction trace in flow store and displays recent actions
          - Checklist path now includes apply-recommendation action to prefill initial answers/comments in draft
           - Assistant chat visual refresh toward mobile style: (completed)
            - Chat-like header with avatar/status, progress strip and step/percent row
            - Bot/user bubbles restyled to mobile visual language (avatar bubble, timestamp, right-side user bubble)
            - Chat surface and option chips adjusted away from card-form look

          ### Fixes and alignment (2026-07-03)

          - Responsible users 403 mitigation in web:
            - `GET /users?companyId=...` requires `users:read`; when 403 occurs, web now falls back to `GET /mobile/bootstrap` and filters users by company for responsible assignment.
          - Responsible companies aligned with mobile behavior:
            - New endpoint helper uses `GET /organization/companies?isContractor=true` for hallazgo/checklist responsible selection.

          - UI alignment fixes requested in desktop web:
            - New inspection modal now opens as right-side panel with dimmed backdrop overlay (instead of centered).
            - Gestión de inspecciones table header row enforced to exact 32px height.
            - Dashboard company selector now merges options from company endpoint and dashboard datasets as fallback when endpoint options are empty.

          - Submit UX hardening in web wizard:
            - After successful save, flow now transitions to a dedicated final "inspección guardada" step instead of closing immediately.
            - Final step allows either closing modal or starting a new inspection flow from start.

          - Assistant chatbot flow parity hardening (web):
            - Rebuilt assistant step to progress strictly one question at a time (sequential dialogue), avoiding multi-block auto-advance.
            - Removed non-mobile extras previously introduced in web assistant (auto proposal application, checklist auto-prefill action, chat trace panel, skip-chat shortcut).
            - Preserved only guided prefill choices aligned with mobile chat flow: goal, area, sector, date, location, inspection type, and path-specific selector (finding type or checklist template).
            - Reworked assistant step into an explicit stage state machine (`goal -> area -> sector -> date -> location -> type -> finding/template -> ready`) so progression depends on confirmed user choices instead of implicit draft defaults.
            - Updated chatbot prompts to align better with the expected conversational cadence from mobile/chat reference and avoid displaying future requests before current step confirmation.
            - Updated stage order to mirror mobile conversational sequence (`goal -> area -> sector -> type -> date -> location -> finding/template -> ready`) and aligned key prompts (`Selecciona el tipo de inspección.`, `Selecciona la fecha de inspección.`, `Capturemos la ubicación obligatoria.`).
            - Type selection is now always explicit in chat (both Hallazgo/Checklist options visible), with only recommendation hinting from selected goal.
            - Checklist template stage now follows conversational suggestion pattern: suggested template card + `Usar sugerida` / `Elegir otra`, instead of immediately presenting a full list.
            - Intro microcopy was split into greeting + goal-confirmed area prompt to avoid repeated question blocks and keep dialogue cadence natural.
            - Final path prompts now preserve bot history after selection (`finding-type` and `template`), so the conversation remains readable when reaching ready state.
            - Assistant chat stage `goal` was removed from web to match mobile flow start exactly (chat now starts directly at area selection).
            - Web prompt texts were aligned to the same literal mobile copy for the core guided sequence (`¿En qué área estás hoy?`, `Selecciona el sector.`, `Selecciona el tipo de inspección.`, `Selecciona la fecha de inspección.`, `Capturemos la ubicación obligatoria.`, `Selecciona el tipo de hallazgo.`, `Te sugiero esta plantilla normativa.`).
            - Type options no longer include web-only recommendation suffixes (`· sugerido`) and now mirror mobile labels exactly (`Hallazgo`, `Checklist normativo`).
            - Checklist suggested-template confirmation action now follows mobile wording pattern (`Confirmar {plantilla}` / `Elegir otra`).
            - Area, sector and finding-type selectors in chat were switched to chip-style interactions to match mobile selector rhythm (instead of web-only card/list treatments).
            - Template selection interaction now mirrors mobile quick-options pattern first (confirm/elegir otra), with full template list only after explicit `Elegir otra`.
            - Bot transition prompts were normalized to mobile cadence by removing web-only contextual prefixes (`{valor} ✓ - ...`) and keeping the same direct prompt text used in mobile.
            - Template alternate flow now emits explicit `Elige una plantilla.` prompt before rendering full template chips, matching the mobile sequence after `Elegir otra`.
            - Chat selectors were moved outside bot bubbles (left-indented control rows) to match mobile message/control separation pattern.
            - Typing indicator timing was tightened to short transition windows and limited to the same kind of stages used in mobile async transitions (sector, tipo, hallazgo/plantilla).
            - Bot bubble spacing/gap was adjusted to match mobile avatar-bubble rhythm more closely (`gap ~7`, full-width row, no extra avatar offset).
            - Selection color behavior now matches mobile variants by stage: area/sector in selected-gold style, and date/finding-type/template chips in selected-navy style.
            - Quick-option text sizing was aligned upward to mobile-equivalent readability in assistant option rows.
            - Bot/user bubble timestamps now use current runtime time instead of fixed placeholder text, matching mobile chat metadata behavior.
            - Typing indicator now uses staggered bounce-dot animation (three sequential dots) and slightly longer transition window to better match the perceived mobile cadence.
            - Bot prompt top offsets were removed inside bubbles (`mt` cleanup) so text starts at the same vertical rhythm as mobile bubbles.
            - User bubble metadata/text styling was aligned closer to mobile: medium body weight and lower timestamp opacity.
            - Chat header status row now mirrors mobile structure (dot indicator + `Activo`) and menu hit-area sizing (`48x48`) for closer parity.
            - Message-to-control vertical rhythm was normalized (`mb` spacing) across area/sector/type/date/location/finding/template selector rows.
            - Chat header/bubbles were further aligned using mobile token values: header bar height `56`, progress wrapper spacing (`px 16 / pb 7`), bot bubble radius `16` with `4` corner cut, and user bubble navy/background/radius matched to mobile tokens.
            - Bot bubble border/shadow now tracks the mobile token combination more closely (`#E3E3E3`, soft 1px/3px shadow), while user bubble removes extra desktop shadow not present in the native component.
            - Chip density/text scale was corrected to match mobile selector rows more closely (`11px` chip text, `12px` quick-option text, token-like padding and muted default chip color).
            - Location capture step now follows the mobile widget structure more closely: titled white card, explanatory copy, `44px` CTA, and a surfaced location/accuracy box inside the widget.
            - Replaced the most visible text glyph placeholders in web assistant with inline SVG/icon treatments closer to mobile semantics: AurelIA sparkles mark, vertical menu dots, map marker, crosshairs/check-circle, and quick-option icons for Hallazgo/Checklist/Confirmar/Elegir otra.
- Replace Type placeholder with mobile-parity Type step UI: (completed)
  - Hallazgo and Checklist cards
  - Dynamic checklist template count
  - Back/continue behavior aligned with manual flow
- Implement observations route split with native web screens: (completed)
  - Hallazgo observations screen (finding type, observation cards, severity, responsables)
  - Checklist observations screen (template picker and metadata)
  - Continue-to-summary route wiring for both paths
- Implement checklist full capture and summary rendering in web wizard: (completed)
  - Item-by-item SI/NO/N/A answers
  - Required details/evidence for NO responses
  - General reference photo and responsibles for findings
  - Summary screen with data from both paths (Hallazgo and Checklist)
- Refine hallazgo observations visual parity with mobile: (completed)
  - Empty state card and count banner behavior
  - Saved observation cards with condition/corrective/evidence/SLA sections
  - Saved observation cards refined with numbering, icon-based delete action and mobile-like spacing/shadows
  - Criticidad block with SLA highlight and save-state button gating
  - Criticidad selector moved to bottom-sheet style modal with description rows and selected state
  - Responsables: personal selector moved to bottom-sheet modal with multi-select states and loading/empty/error messages
  - Responsables: company selector moved to bottom-sheet modal with selected state and loading/empty/error messages
- Next pending in this iteration:
  - Align fine-grained visual details of cards/badges/modals with pixel-level parity against mobile
  - Validate if evidence links should also reference finding entities. Current API exposed to web supports linking evidence to inspection (`POST /inspections/:id/evidences/:evidenceId/link`) but not directly to inspection finding entity.

### Iteration 4

- Implement checklist step with template selection and answers (SI/NO/NA).
- Implement hallazgo observations step with severity, responsible company and responsible users.
- Defer camera/voice features (hidden or disabled).

### Iteration 5

- Implement summary step for both paths.
- Implement real submit pipeline:
  - create inspection
  - submit answers
  - create findings
  - close inspection when business rule applies
- Use existing contracts and service layer extensions.

### Iteration 6

- Invalidate and refetch management table and KPI queries after successful save.
- Add success/saved final step and close behavior.

### Iteration 7

- Hardening and QA pass:
  - form validations
  - API error handling
  - role/permission edge cases
  - loading and empty states

## Target web module structure

- apps/web/src/modules/inspections/new-inspection/
  - components/
  - steps/
  - state/
  - hooks/
  - services/

Legacy temporary components live in:
- apps/web/src/modules/inspections/components/

Current active controller for the wizard lives in:
- apps/web/src/modules/inspections/new-inspection/NewInspectionModalController.tsx

## Validation Commands

- pnpm --filter web typecheck
- pnpm --filter web build

## Risks

- Backend semantics for inspection final status can differ between hallazgo and checklist flow.
- Some catalogs may require endpoint normalization in web service layer.
- UX parity with mobile requires careful mapping of validations and branching logic.
