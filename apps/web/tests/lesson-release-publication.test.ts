import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G4_L3_ATOMIC_RELEASE_ID,
  G5_L4_ATOMIC_RELEASE_ID,
  G5_L5_ATOMIC_RELEASE_ID,
  createVerifiedLessonReleasePromotionForTesting,
  deriveLessonReleaseStates,
  hasExactG4L3AtomicShape,
  hasExactG5L4AtomicShape,
  hasExactG5L5AtomicShape,
  isReleasePublished,
  isTargetPublished,
  type LessonReleaseDefinition,
  type LessonReleaseLedgerEntry,
  type PublicationCatalog,
  type PublicationTarget,
  type StrictCompletionIdentity,
  type VerifiedLessonReleasePromotion,
} from '../lib/lesson-release-publication';

const ARTIFACT_SHA256 = Object.freeze({
  releaseManifest: 'a'.repeat(64),
  releaseLedger: 'b'.repeat(64),
  completionLedger: 'c'.repeat(64),
});
const NOW_MS = Date.parse('2026-07-29T00:00:00.000Z');
const members = Object.freeze([
  {animationId: 'page-a', assetId: 'asset-a', releaseRole: 'active-xml-referenced-page' as const},
  {animationId: 'page-b', assetId: 'asset-b', releaseRole: 'active-xml-referenced-page' as const},
  {animationId: 'shell', assetId: 'asset-shell', releaseRole: 'course-shell' as const},
]);
const definition: LessonReleaseDefinition = Object.freeze({
  releaseId: 'lesson-fixture',
  publicationMode: 'atomic',
  expectedMemberCount: members.length,
  scope: Object.freeze({collection: 'course', grade: 4, lesson: 3, excludeNonMembers: true}),
  members,
});

function ledgerFor(completions: readonly StrictCompletionIdentity[], published = completions.length === members.length): LessonReleaseLedgerEntry {
  const completionById = new Map(completions.map((entry) => [entry.animationId, entry]));
  const ledgerMembers = members.map((member) => {
    const completion = completionById.get(member.animationId);
    const status = !completion
      ? 'missing'
      : completion.assetId === member.assetId
        ? 'strict-complete'
        : 'asset-mismatch';
    return {
      ...member,
      strictComplete: status === 'strict-complete',
      status,
      ledgerAssetId: completion?.assetId ?? null,
    };
  });
  const strictCompleteCount = ledgerMembers.filter((member) => member.strictComplete).length;
  const missingCount = ledgerMembers.filter((member) => member.status === 'missing').length;
  const assetMismatchCount = ledgerMembers.filter((member) => member.status === 'asset-mismatch').length;
  return {
    releaseId: definition.releaseId,
    publicationMode: 'atomic',
    expectedMemberCount: members.length,
    strictCompleteCount,
    missingCount,
    assetMismatchCount,
    published,
    status: published ? 'published' : 'unpublished',
    gate: {
      kind: 'atomic-all-members-strict',
      requiredCount: members.length,
      admittedCount: strictCompleteCount,
      open: published,
    },
    members: ledgerMembers,
  };
}

function promotion(
  overrides: Partial<VerifiedLessonReleasePromotion> = {},
): VerifiedLessonReleasePromotion {
  return createVerifiedLessonReleasePromotionForTesting({
    releaseId: definition.releaseId,
    promotionState: 'owner-promoted',
    evidenceType: 'help-math-lesson-evidence-receipt-v1',
    evidenceReceiptSha256: 'd'.repeat(64),
    evidencePayloadSha256: 'e'.repeat(64),
    issuedAt: '2026-07-28T00:00:00.000Z',
    expiresAt: '2026-08-28T00:00:00.000Z',
    expectedMemberCount: members.length,
    strictCompleteCount: members.length,
    expectedPublishedCount: 1,
    publishedCount: 1,
    controlledPreviewAccepted: true,
    stagedAccepted: true,
    ownerPromotionAccepted: true,
    cryptographicallyVerified: true,
    signerAuthorityVerified: true,
    currentBuildBindingsVerified: true,
    invalidationPolicy: 'exact-hash-drift-closes-release-v1',
    releaseDefinitionSha256: ARTIFACT_SHA256.releaseManifest,
    completionLedgerSha256: ARTIFACT_SHA256.completionLedger,
    releaseLedgerSha256: ARTIFACT_SHA256.releaseLedger,
    reviewDecisionSha256: 'f'.repeat(64),
    ownerDecisionSha256: '1'.repeat(64),
    promotionReleaseBundleSha256: '2'.repeat(64),
    ...overrides,
  });
}

function publication(
  completions: readonly StrictCompletionIdentity[],
  ledger = ledgerFor(completions),
  bindingsCurrent = true,
  promotions: readonly VerifiedLessonReleasePromotion[] = [],
): PublicationCatalog {
  return {
    definitions: [definition],
    releases: deriveLessonReleaseStates({
      artifactSha256: ARTIFACT_SHA256,
      bindingsCurrent,
      completions,
      definitions: [definition],
      ledgerEntries: [ledger],
      nowMs: NOW_MS,
      promotions,
    }),
    diagnostics: [],
    artifactSha256: ARTIFACT_SHA256,
  };
}

function target(animationId: string, assetId: string, overrides: Partial<PublicationTarget> = {}): PublicationTarget {
  return {
    animationId,
    assetId,
    classification: {collection: 'course', grade: 4, lesson: 3},
    migration: {status: 'complete'},
    ...overrides,
  };
}

test('an atomic lesson remains unpublished at zero and partial strict completion', () => {
  const empty = publication([]);
  assert.equal(empty.releases[0]?.strictCompleteMemberCount, 0);
  assert.equal(isReleasePublished(empty, definition.releaseId), false);

  const partialCompletions = members.slice(0, 2);
  const partial = publication(partialCompletions);
  assert.equal(partial.releases[0]?.strictCompleteMemberCount, 2);
  assert.equal(partial.releases[0]?.published, false);
  assert.equal(isTargetPublished(target('page-a', 'asset-a'), partial), false);
});

test('55/55-style strict completion stays closed until the exact promotion chain and EvidenceReceiptV1 are verified', () => {
  const strictOnly = publication(members);
  assert.equal(strictOnly.releases[0]?.strictCompleteMemberCount, members.length);
  assert.equal(strictOnly.releases[0]?.promotionGateSatisfied, false);
  assert.equal(strictOnly.releases[0]?.published, false);
  assert.ok(
    strictOnly.releases[0]?.diagnostics.includes(
      'verified EvidenceReceiptV1 Owner promotion is missing',
    ),
  );

  const promoted = publication(
    members,
    ledgerFor(members),
    true,
    [promotion()],
  );
  assert.equal(promoted.releases[0]?.promotionGateSatisfied, true);
  assert.equal(promoted.releases[0]?.evidenceReceiptSha256, 'd'.repeat(64));
  assert.equal(promoted.releases[0]?.published, true);
  for (const member of members) {
    assert.equal(
      isTargetPublished(target(member.animationId, member.assetId), promoted),
      true,
    );
  }
});

test('promotion stage, authority, expiry, and exact ledger hash drift all fail closed', () => {
  for (const invalidPromotion of [
    promotion({controlledPreviewAccepted: false}),
    promotion({stagedAccepted: false}),
    promotion({ownerPromotionAccepted: false}),
    promotion({cryptographicallyVerified: false}),
    promotion({signerAuthorityVerified: false}),
    promotion({currentBuildBindingsVerified: false}),
    promotion({expiresAt: '2026-07-29T00:00:00.000Z'}),
    promotion({releaseDefinitionSha256: '3'.repeat(64)}),
    promotion({completionLedgerSha256: '4'.repeat(64)}),
    promotion({releaseLedgerSha256: '5'.repeat(64)}),
    structuredClone(promotion()),
  ]) {
    const state = publication(
      members,
      ledgerFor(members),
      true,
      [invalidPromotion],
    ).releases[0];
    assert.equal(state?.promotionGateSatisfied, false);
    assert.equal(state?.published, false);
    assert.equal(state?.evidenceReceiptSha256, null);
  }
});

test('wrong assets, stale bindings, and forged booleans fail closed', () => {
  const wrongAsset = [...members.slice(0, 2), {animationId: 'shell', assetId: 'wrong'}];
  assert.equal(publication(wrongAsset).releases[0]?.published, false);
  assert.equal(publication(members, ledgerFor(members), false).releases[0]?.published, false);
  assert.equal(publication(members.slice(0, 2), ledgerFor(members.slice(0, 2), true)).releases[0]?.published, false);
});

test('controlled nonmembers stay hidden while unrelated strict items retain individual publication', () => {
  const complete = publication(members);
  assert.equal(isTargetPublished(target('historical-variant', 'asset-history'), complete), false);
  assert.equal(isTargetPublished(target('page-a', 'wrong-asset'), complete), false);
  assert.equal(isTargetPublished(target('unrelated', 'asset-unrelated', {
    classification: {collection: 'course', grade: 3, lesson: 1},
  }), complete), true);
  assert.equal(isTargetPublished(target('unrelated-draft', 'asset-draft', {
    classification: {collection: 'course', grade: 3, lesson: 1},
    migration: {status: 'validating'},
  }), complete), false);
});

test('protected G4 L3 page-only shape drift cannot publish even when its forged ledger agrees', () => {
  const pageMembers = Array.from({length: 39}, (_, index) => ({
    animationId: `g4-l3-page-${index + 1}`,
    assetId: `asset-${index + 1}`,
    releaseRole: 'active-xml-referenced-page' as const,
  }));
  const exactDefinition: LessonReleaseDefinition = {
    releaseId: G4_L3_ATOMIC_RELEASE_ID,
    publicationMode: 'atomic',
    expectedMemberCount: 39,
    scope: {collection: 'course', grade: 4, lesson: 3, excludeNonMembers: true},
    members: pageMembers,
  };
  assert.equal(hasExactG4L3AtomicShape(exactDefinition), true);
  assert.equal(hasExactG4L3AtomicShape({
    ...exactDefinition,
    scope: {...exactDefinition.scope, lesson: 4},
  }), false);
  assert.equal(hasExactG4L3AtomicShape({
    ...exactDefinition,
    expectedMemberCount: 40,
    members: [...exactDefinition.members, {
      animationId: 'g4-l3-shell',
      assetId: 'asset-shell',
      releaseRole: 'course-shell' as const,
    }],
  }), false);

  const driftedMembers = [...pageMembers, {
    animationId: 'g4-l3-shell',
    assetId: 'asset-shell',
    releaseRole: 'course-shell' as const,
  }];
  const driftedDefinition: LessonReleaseDefinition = {
    releaseId: G4_L3_ATOMIC_RELEASE_ID,
    publicationMode: 'atomic',
    expectedMemberCount: 40,
    scope: {collection: 'course', grade: 4, lesson: 3, excludeNonMembers: true},
    members: driftedMembers,
  };
  assert.equal(hasExactG4L3AtomicShape(driftedDefinition), false);
  const driftedLedger: LessonReleaseLedgerEntry = {
    releaseId: driftedDefinition.releaseId,
    publicationMode: 'atomic',
    expectedMemberCount: 40,
    strictCompleteCount: 40,
    missingCount: 0,
    assetMismatchCount: 0,
    published: true,
    status: 'published',
    gate: {kind: 'atomic-all-members-strict', requiredCount: 40, admittedCount: 40, open: true},
    members: driftedMembers.map((member) => ({
      animationId: member.animationId,
      assetId: member.assetId,
      strictComplete: true,
      status: 'strict-complete',
      ledgerAssetId: member.assetId,
    })),
  };
  const [state] = deriveLessonReleaseStates({
    bindingsCurrent: true,
    completions: driftedMembers,
    definitions: [driftedDefinition],
    ledgerEntries: [driftedLedger],
  });
  assert.equal(state?.strictCompleteMemberCount, 40);
  assert.equal(state?.published, false);
  assert.ok(state?.diagnostics.includes('protected atomic lesson release shape is invalid'));
});

test('protected G5 L4 requires exactly 54 page-only XML members', () => {
  const pageMembers = Array.from({length: 54}, (_, index) => ({
    animationId: `g5-l4-page-${index + 1}`,
    assetId: `g5-asset-${index + 1}`,
    releaseRole: 'active-xml-referenced-page' as const,
  }));
  const exact: LessonReleaseDefinition = {
    releaseId: G5_L4_ATOMIC_RELEASE_ID,
    publicationMode: 'atomic',
    expectedMemberCount: 54,
    scope: {collection: 'course', grade: 5, lesson: 4, excludeNonMembers: true},
    members: pageMembers,
  };
  assert.equal(hasExactG5L4AtomicShape(exact), true);
  assert.equal(hasExactG5L4AtomicShape({
    ...exact,
    expectedMemberCount: 55,
    members: [...exact.members, {
      animationId: 'shell-course-g05-l04-index-local',
      assetId: 'g5-shell-asset',
      releaseRole: 'course-shell' as const,
    }],
  }), false);
  assert.equal(hasExactG5L4AtomicShape({
    ...exact,
    expectedMemberCount: 53,
    members: exact.members.slice(0, 53),
  }), false);
  assert.equal(hasExactG5L4AtomicShape({...exact, scope: {...exact.scope, lesson: 5}}), false);
});

test('protected G5 L5 requires exactly 56 page-only XML members', () => {
  const pageMembers = Array.from({length: 56}, (_, index) => ({
    animationId: `g5-l5-page-${index + 1}`,
    assetId: `g5-l5-asset-${index + 1}`,
    releaseRole: 'active-xml-referenced-page' as const,
  }));
  const exact: LessonReleaseDefinition = {
    releaseId: G5_L5_ATOMIC_RELEASE_ID,
    publicationMode: 'atomic',
    expectedMemberCount: 56,
    scope: {collection: 'course', grade: 5, lesson: 5, excludeNonMembers: true},
    members: pageMembers,
  };
  assert.equal(hasExactG5L5AtomicShape(exact), true);
  assert.equal(
    hasExactG5L5AtomicShape({
      ...exact,
      expectedMemberCount: 57,
      members: [...exact.members, {
        animationId: 'shell-course-g05-l05-index-local',
        assetId: 'g5-l5-shell-asset',
        releaseRole: 'course-shell' as const,
      }],
    }),
    false,
  );
  assert.equal(hasExactG5L5AtomicShape({
    ...exact,
    expectedMemberCount: 55,
    members: exact.members.slice(0, 55),
  }), false);
  assert.equal(hasExactG5L5AtomicShape({...exact, scope: {...exact.scope, lesson: 4}}), false);
});

test('release membership controls publication even if catalog classification drifts', () => {
  const partial = publication(members.slice(0, 1));
  assert.equal(isTargetPublished(target('page-a', 'asset-a', {
    classification: {collection: 'course', grade: 3, lesson: 1},
  }), partial), false);
});

test('protected G5 L4 and G5 L5 stay hidden when their manifest definitions are missing', () => {
  const missingManifest: PublicationCatalog = {
    definitions: [],
    releases: [],
    diagnostics: ['lesson release manifest unavailable'],
    artifactSha256: {releaseManifest: null, releaseLedger: null, completionLedger: null},
  };
  assert.equal(isTargetPublished(target('g5-l4-page', 'g5-l4-asset', {
    classification: {collection: 'course', grade: 5, lesson: 4},
  }), missingManifest), false);
  assert.equal(isTargetPublished(target('g5-l5-page', 'g5-l5-asset', {
    classification: {collection: 'course', grade: 5, lesson: 5},
  }), missingManifest), false);
  assert.equal(isTargetPublished(target('unrelated', 'unrelated-asset', {
    classification: {collection: 'course', grade: 3, lesson: 1},
  }), missingManifest), true);
});
