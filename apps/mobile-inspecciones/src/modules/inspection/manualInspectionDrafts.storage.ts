import { InspectionType } from '@aurelia/contracts';
import { localStorageDriver } from '../../shared/storage/local-storage';
import type { ManualInspectionDraft } from './manualInspection.store';

const DRAFTS_KEY = 'manual_inspection_drafts:v1';
const ACTIVE_DRAFT_KEY = 'manual_inspection_active_draft_id:v1';

export interface PersistedManualInspectionDraft {
  draftId: string;
  localId: string;
  draftMode: 'manual' | 'chat';
  inspectionType: InspectionType;
  currentStep: number;
  updatedAt: string;
  progressPercentage: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  draft: ManualInspectionDraft;
}

function now(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

function progressFromStep(currentStep: number): number {
  return Math.max(20, Math.min(100, currentStep * 20));
}

async function getAllDrafts(): Promise<PersistedManualInspectionDraft[]> {
  return (await localStorageDriver.get<PersistedManualInspectionDraft[]>(DRAFTS_KEY)) ?? [];
}

async function saveAllDrafts(drafts: PersistedManualInspectionDraft[]): Promise<void> {
  await localStorageDriver.set(DRAFTS_KEY, drafts);
}

export async function getActiveManualInspectionDraftId(): Promise<string | null> {
  return localStorageDriver.get<string>(ACTIVE_DRAFT_KEY);
}

export async function listIncompleteManualInspectionDrafts(): Promise<PersistedManualInspectionDraft[]> {
  const drafts = await getAllDrafts();
  return drafts
    .filter((item) => item.status === 'IN_PROGRESS')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getManualInspectionDraftById(draftId: string): Promise<PersistedManualInspectionDraft | null> {
  const drafts = await getAllDrafts();
  return drafts.find((item) => item.draftId === draftId) ?? null;
}

export async function saveManualInspectionDraftSnapshot(input: {
  draftId?: string | null;
  mode?: 'manual' | 'chat';
  draft: ManualInspectionDraft;
  currentStep: number;
}): Promise<PersistedManualInspectionDraft> {
  const drafts = await getAllDrafts();
  const draftId = input.draftId ?? createId('manual-draft');
  const previous = drafts.find((item) => item.draftId === draftId);
  const record: PersistedManualInspectionDraft = {
    draftId,
    localId: input.draft.lastSavedResult?.inspectionId ?? draftId,
    draftMode: input.mode ?? previous?.draftMode ?? 'manual',
    inspectionType: input.draft.inspectionType,
    currentStep: input.currentStep,
    updatedAt: now(),
    progressPercentage: progressFromStep(input.currentStep),
    status: 'IN_PROGRESS',
    draft: input.draft,
  };
  const next = [record, ...drafts.filter((item) => item.draftId !== draftId)];
  await saveAllDrafts(next);
  await localStorageDriver.set(ACTIVE_DRAFT_KEY, draftId);
  return record;
}

export async function markManualInspectionDraftCompleted(draftId: string): Promise<void> {
  const drafts = await getAllDrafts();
  await saveAllDrafts(drafts.map((item) => item.draftId === draftId ? { ...item, status: 'COMPLETED', updatedAt: now(), progressPercentage: 100 } : item));
  const activeDraftId = await getActiveManualInspectionDraftId();
  if (activeDraftId === draftId) await localStorageDriver.remove(ACTIVE_DRAFT_KEY);
}

export async function removeManualInspectionDraft(draftId: string): Promise<void> {
  const drafts = await getAllDrafts();
  await saveAllDrafts(drafts.filter((item) => item.draftId !== draftId));
  const activeDraftId = await getActiveManualInspectionDraftId();
  if (activeDraftId === draftId) await localStorageDriver.remove(ACTIVE_DRAFT_KEY);
}

export async function clearManualInspectionDrafts(): Promise<void> {
  await localStorageDriver.remove(DRAFTS_KEY);
  await localStorageDriver.remove(ACTIVE_DRAFT_KEY);
}