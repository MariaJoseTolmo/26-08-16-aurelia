# Mobile Inspecciones Parity Audit (Checklist vs Hallazgo)

Date: 2026-07-01
Scope: manual inspection flows in mobile-inspecciones, offline-first save/sync, attachments, draft persistence, bootstrap catalogs and permission/scope behavior.

## Summary

- Hallazgo flow is the most complete path.
- Checklist flow has attachment materialization for finding evidence, but still has parity gaps in responsible assignment and in data richness of finding payload.
- Bootstrap filtering by authenticated scope is implemented on API side.
- /users 403 is expected for profiles without users:read and should not be silenced.

## What Is Implemented (OK)

1. Attachment pipeline materialization (both flows)
- mobile pre-upload to /files/upload before batch sync
- UPLOAD_ATTACHMENT materialized in API into evidences + evidence_links
- finding evidence from Hallazgo and Checklist NO answers is enqueued and synced

2. Draft persistence and resume
- persistent drafts storage exists and is integrated in main manual screens
- dashboard loads incomplete drafts and supports resume by step

3. Session persistence
- mobile session is persisted and hydrated at app startup

4. Bootstrap scope filtering
- mobile bootstrap now receives authenticated user context
- catalogs in bootstrap are filtered by area/company scope

## Fix Applied In This Iteration

1. Hallazgo Step 4 "Tú" chip logic fixed
- "Tú" now appears only when selected responsible user id matches authenticated user id.

2. Hallazgo Step 4 parity hardening
- enabled draft persistence hook on summary screen
- mark draft as COMPLETED after successful save

3. Checklist Iteration A (implemented)
- Added responsible users multi-select picker in checklist flow when findings exist
- Added validation: findings require both responsible company and at least one responsible user before continue
- Checklist finding payload now sends responsibleCompanyId and responsibleUserIds
- ownerUserId in checklist findings now uses first selected responsible (same convention as Hallazgo)

4. Checklist Iteration B (implemented)
- Checklist general reference photo is now enqueued as UPLOAD_ATTACHMENT
- Backend materializer now supports inspection-level attachment links (entity_type=inspection) in addition to finding-level
- Result: general photo is persisted as file + evidence + evidence_link during sync, not only as a text note

## Remaining Gaps (Checklist vs Hallazgo)

1. Responsible users selection in checklist UI
- checklist currently selects responsible company only
- responsible users are not selected interactively in checklist UI
- saving checklist findings currently does not send responsibleUserIds/responsibleCompanyId in finding payload

2. Finding metadata richness in checklist
- checklist finding payload currently uses minimal fields (severity HIGH, owner null)
- Hallazgo includes richer metadata (findingTypeId, severityId, responsibleCompanyId, responsibleUserIds)

3. General checklist reference photo materialization
- checklist requires general photo in UI, but this asset is not currently uploaded as evidence (only stored as text note/file name context)

## Suggested Iterative Plan

### Iteration A (high priority)
- Add responsible users picker to checklist path (multi-select)
- Persist selected responsible users in draft store (already supported by findingResponsibleIds)
- Send responsibleCompanyId + responsibleUserIds in checklist finding payload
- Set ownerUserId = first selected responsible (same convention as Hallazgo)

### Iteration B
- Decide expected behavior for checklist general photo:
  - Option 1: attach to inspection as supporting evidence
  - Option 2: keep as local/context-only photo
- If Option 1 is chosen, enqueue UPLOAD_ATTACHMENT linked to inspection entity after CREATE_INSPECTION

### Iteration C
- Add parity smoke tests:
  - Hallazgo save with evidence online/offline
  - Checklist NO item with evidence online/offline
  - interruption/resume from each step
  - scope validation for bootstrap catalogs and /users endpoint behavior

## Acceptance Checks

1. For non-admin profile without users:read
- /api/users returns 403 (expected)
- app still works using bootstrap/local catalogs already scoped for that profile

2. For both flows
- UPLOAD_ATTACHMENT operations end as SYNCED
- files, evidences, evidence_links rows are created in local API DB
- attachments physically exist in API uploads directory when provider is local

