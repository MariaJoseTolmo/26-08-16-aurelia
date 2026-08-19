# Phase 5 Incident API validation checklist

This checklist closes Phase 5 for the incident backend MVP.

## Required local validation

Run from the repository root:

```bash
pnpm build --force
pnpm lint --force
```

Run from `apps/api`:

```bash
pnpm migration:run
pnpm test
```

Expected results:

- Build succeeds without cache.
- Lint succeeds without errors.
- TypeORM reports no pending migrations after the first successful run.
- Smoke tests print `api smoke tests passed`.

## Covered by `pnpm test`

The smoke suite covers the full happy path for inspections and incidents.

Incident flow coverage:

- `GET /api/incidents/types`
- `GET /api/incidents/levels`
- `POST /api/incidents`
- `GET /api/incidents`
- `GET /api/incidents/:id`
- `PATCH /api/incidents/:id/status`
- `POST /api/incidents/:id/flash-report`
- `GET /api/incidents/:id/flash-report`
- `POST /api/incidents/:id/evidences/:evidenceId/link`
- `GET /api/incidents/:id/evidences`
- `POST /api/incidents/:id/comments`
- `GET /api/incidents/:id/comments`
- `GET /api/incidents/:id/export`
- `GET /api/incidents/:id/export/pdf`
- `POST /api/incidents/:id/immediate-actions`
- `GET /api/incidents/:id/immediate-actions`
- `PATCH /api/incidents/immediate-actions/:actionId`
- `POST /api/incidents/:id/investigations`
- `GET /api/incidents/:id/investigations`
- `POST /api/incidents/investigations/:investigationId/five-why`
- `POST /api/incidents/investigations/:investigationId/peepo`
- `POST /api/incidents/:id/action-plans`
- `GET /api/incidents/:id/action-plans`
- `POST /api/incidents/:id/close` blocked while action plan is open
- `PATCH /api/incidents/action-plans/:actionPlanId`
- `POST /api/incidents/:id/close` succeeds after action plan is completed
- `GET /api/incidents/dashboard/summary`

## Manual exploratory checks

Use `docs/api/phase5.http` when you need to inspect payloads manually.

Recommended manual order:

1. List incident types and levels.
2. Create an incident.
3. Create or update Flash Report.
4. Create immediate actions.
5. Create investigation.
6. Add 5 Why and PEEPO analysis.
7. Create action plan.
8. Confirm close fails while action plan is open.
9. Complete action plan.
10. Close incident.
11. Review export JSON/PDF and dashboard summary.

## Design decisions intentionally deferred

- Real authentication and role guards.
- Mobile offline incident capture.
- Notification dispatch.
- Email delivery.
- Frontend dashboard visualization.
- AI classification/recommendation.
