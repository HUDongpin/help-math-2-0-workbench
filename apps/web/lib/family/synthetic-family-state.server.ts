import 'server-only';

import {randomUUID} from 'node:crypto';

import type {
  AuthorizationContext,
  FamilyMessageReceipt,
  FamilyNotificationPreference,
} from './types';

const SYNTHETIC_GUARDIAN_LINKS = Object.freeze({
  '10000000-0000-4000-8000-000000000020': {
    childId: '10000000-0000-4000-8000-000000000101',
    guardianUserId: '10000000-0000-4000-8000-000000000010',
  },
  '10000000-0000-4000-8000-000000000021': {
    childId: '10000000-0000-4000-8000-000000000101',
    guardianUserId: '10000000-0000-4000-8000-000000000011',
  },
  '10000000-0000-4000-8000-000000000022': {
    childId: '10000000-0000-4000-8000-000000000102',
    guardianUserId: '10000000-0000-4000-8000-000000000010',
  },
} satisfies Record<string, {childId: string; guardianUserId: string}>);

interface SyntheticState {
  closedThreads: Set<string>;
  dynamicInvitations: Set<string>;
  dynamicThreads: Map<string, SyntheticThreadAuthorization>;
  messageReceipts: Map<string, FamilyMessageReceipt>;
  preferences: Map<string, FamilyNotificationPreference>;
  readThreads: Set<string>;
  revokedInvitations: Set<string>;
  revokedLinks: Set<string>;
}

declare global {
  var __helpMathSyntheticFamilyState: SyntheticState | undefined;
}

function state(): SyntheticState {
  globalThis.__helpMathSyntheticFamilyState ??= {
    closedThreads: new Set(),
    dynamicInvitations: new Set(),
    dynamicThreads: new Map(),
    messageReceipts: new Map(),
    preferences: new Map(),
    readThreads: new Set(),
    revokedInvitations: new Set(),
    revokedLinks: new Set(),
  };
  return globalThis.__helpMathSyntheticFamilyState;
}

const SYNTHETIC_INVITATION_IDS = new Set([
  syntheticUuid(7_001),
  syntheticUuid(7_002),
  syntheticUuid(7_003),
]);

export function revokeSyntheticGuardianInvitation(invitationId: string) {
  if (!(
    SYNTHETIC_INVITATION_IDS.has(invitationId)
    || state().dynamicInvitations.has(invitationId)
  )) return false;
  state().revokedInvitations.add(invitationId);
  return true;
}

export function registerSyntheticGuardianInvitation(invitationId: string) {
  state().dynamicInvitations.add(invitationId);
}

interface SyntheticThreadAuthorization {
  childId: string;
  guardianUserId: string;
  teacherUserId: string;
}

const SYNTHETIC_TEACHER_ID = '10000000-0000-4000-8000-000000000012';

function syntheticUuid(value: number) {
  return `10000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
}

const SYNTHETIC_THREADS = Object.freeze({
  [syntheticUuid(1_501)]: {
    childId: syntheticUuid(101),
    guardianUserId: syntheticUuid(10),
    teacherUserId: SYNTHETIC_TEACHER_ID,
  },
  [syntheticUuid(1_502)]: {
    childId: syntheticUuid(101),
    guardianUserId: syntheticUuid(10),
    teacherUserId: SYNTHETIC_TEACHER_ID,
  },
  [syntheticUuid(1_503)]: {
    childId: syntheticUuid(101),
    guardianUserId: syntheticUuid(10),
    teacherUserId: SYNTHETIC_TEACHER_ID,
  },
  [syntheticUuid(2_501)]: {
    childId: syntheticUuid(102),
    guardianUserId: syntheticUuid(10),
    teacherUserId: SYNTHETIC_TEACHER_ID,
  },
  [syntheticUuid(2_502)]: {
    childId: syntheticUuid(102),
    guardianUserId: syntheticUuid(10),
    teacherUserId: SYNTHETIC_TEACHER_ID,
  },
  [syntheticUuid(2_503)]: {
    childId: syntheticUuid(102),
    guardianUserId: syntheticUuid(10),
    teacherUserId: SYNTHETIC_TEACHER_ID,
  },
  [syntheticUuid(6_001)]: {
    childId: syntheticUuid(101),
    guardianUserId: syntheticUuid(10),
    teacherUserId: SYNTHETIC_TEACHER_ID,
  },
  [syntheticUuid(6_002)]: {
    childId: syntheticUuid(102),
    guardianUserId: syntheticUuid(10),
    teacherUserId: SYNTHETIC_TEACHER_ID,
  },
  [syntheticUuid(6_004)]: {
    childId: syntheticUuid(101),
    guardianUserId: syntheticUuid(11),
    teacherUserId: SYNTHETIC_TEACHER_ID,
  },
} satisfies Record<string, SyntheticThreadAuthorization>);

function syntheticThread(threadId: string) {
  return SYNTHETIC_THREADS[threadId as keyof typeof SYNTHETIC_THREADS]
    ?? state().dynamicThreads.get(threadId);
}

export function isSyntheticFamilyThreadAuthorized(
  context: AuthorizationContext,
  threadId: string,
) {
  const thread = syntheticThread(threadId);
  if (!thread) return false;
  return context.roles.includes('guardian')
    ? thread.guardianUserId === context.appUserId
      && isSyntheticFamilyChildAuthorized(context.appUserId, thread.childId)
    : context.roles.includes('teacher')
      ? thread.teacherUserId === context.appUserId
      : false;
}

export function isSyntheticFamilyUserRevoked(appUserId: string) {
  return !Object.entries(SYNTHETIC_GUARDIAN_LINKS).some(
    ([linkId, link]) => link.guardianUserId === appUserId
      && !state().revokedLinks.has(linkId),
  );
}

export function syntheticFamilyChildIds(appUserId: string) {
  return Object.entries(SYNTHETIC_GUARDIAN_LINKS)
    .filter(([linkId, link]) => link.guardianUserId === appUserId
      && !state().revokedLinks.has(linkId))
    .map(([, link]) => link.childId);
}

export function syntheticGuardianLinkIdForChild(
  appUserId: string,
  childId: string,
) {
  return Object.entries(SYNTHETIC_GUARDIAN_LINKS).find(
    ([linkId, link]) => link.guardianUserId === appUserId
      && link.childId === childId
      && !state().revokedLinks.has(linkId),
  )?.[0];
}

export function isSyntheticFamilyChildAuthorized(
  appUserId: string,
  childId: string,
) {
  return syntheticFamilyChildIds(appUserId).includes(childId);
}

export function revokeSyntheticGuardianLink(guardianLinkId: string) {
  const link = SYNTHETIC_GUARDIAN_LINKS[guardianLinkId as
    keyof typeof SYNTHETIC_GUARDIAN_LINKS];
  if (!link) return false;
  state().revokedLinks.add(guardianLinkId);
  return true;
}

export function relinquishSyntheticGuardianLink(
  context: AuthorizationContext,
  guardianLinkId: string,
) {
  const link = SYNTHETIC_GUARDIAN_LINKS[guardianLinkId as
    keyof typeof SYNTHETIC_GUARDIAN_LINKS];
  if (!link || link.guardianUserId !== context.appUserId) return false;
  state().revokedLinks.add(guardianLinkId);
  return true;
}

export function sendSyntheticFamilyMessage({
  context,
  childId,
  clientMutationId,
  staffUserId,
  threadId,
}: Readonly<{
  context: AuthorizationContext;
  childId?: string;
  clientMutationId: string;
  staffUserId?: string;
  threadId?: string;
}>) {
  const mutationKey = `${context.appUserId}:${clientMutationId}`;
  const existing = state().messageReceipts.get(mutationKey);
  if (existing) return existing;
  if (threadId && !isSyntheticFamilyThreadAuthorized(context, threadId)) {
    return null;
  }
  if (!threadId && (
    !context.roles.includes('guardian')
    || !childId
    || !isSyntheticFamilyChildAuthorized(context.appUserId, childId)
    || staffUserId !== SYNTHETIC_TEACHER_ID
  )) return null;
  const resolvedThreadId = threadId ?? randomUUID();
  if (!threadId) state().dynamicThreads.set(resolvedThreadId, {
    childId: childId!,
    guardianUserId: context.appUserId,
    teacherUserId: SYNTHETIC_TEACHER_ID,
  });
  const receipt = {
    messageId: randomUUID(),
    threadId: resolvedThreadId,
  };
  state().messageReceipts.set(mutationKey, receipt);
  return receipt;
}

export function markSyntheticFamilyThreadRead(
  context: AuthorizationContext,
  threadId: string,
) {
  if (!isSyntheticFamilyThreadAuthorized(context, threadId)) return false;
  state().readThreads.add(threadId);
  return true;
}

export function closeSyntheticFamilyThread(
  context: AuthorizationContext,
  threadId: string,
) {
  if (!isSyntheticFamilyThreadAuthorized(context, threadId)) return false;
  state().closedThreads.add(threadId);
  return true;
}

export function syntheticFamilyThreadIsClosed(
  context: AuthorizationContext,
  threadId: string,
) {
  return isSyntheticFamilyThreadAuthorized(context, threadId)
    && state().closedThreads.has(threadId);
}

export function setSyntheticFamilyNotificationPreference(
  appUserId: string,
  preference: FamilyNotificationPreference,
) {
  state().preferences.set(appUserId, preference);
}

export function resetSyntheticFamilyStateForTests() {
  if (process.env.NODE_ENV === 'production') return;
  Reflect.deleteProperty(globalThis, '__helpMathSyntheticFamilyState');
}
