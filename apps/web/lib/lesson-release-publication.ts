import type {MigrationStatus} from './catalog-overlays';

export interface LessonReleaseMember {
  animationId: string;
  assetId: string;
  releaseRole: 'active-xml-referenced-page' | 'course-shell';
}

export interface LessonReleaseScope {
  collection: string;
  grade: number | 'elementary' | null;
  lesson: number | null;
  excludeNonMembers: boolean;
}

export interface LessonReleaseDefinition {
  releaseId: string;
  publicationMode: 'atomic';
  expectedMemberCount: number;
  scope: LessonReleaseScope;
  members: readonly LessonReleaseMember[];
}

export interface LessonReleaseLedgerEntry {
  releaseId: string;
  publicationMode: string;
  expectedMemberCount: number;
  strictCompleteCount: number;
  missingCount: number;
  assetMismatchCount: number;
  published: boolean;
  status: string;
  gate: Readonly<{
    kind: string;
    requiredCount: number;
    admittedCount: number;
    open: boolean;
  }>;
  members: readonly Readonly<{
    animationId: string;
    assetId: string;
    strictComplete: boolean;
    status: string;
    ledgerAssetId: string | null;
  }>[];
}

export interface StrictCompletionIdentity {
  animationId: string;
  assetId: string;
}

export interface VerifiedLessonReleasePromotion {
  releaseId: string;
  promotionState: string;
  evidenceType: string;
  evidenceReceiptSha256: string;
  evidencePayloadSha256: string;
  issuedAt: string;
  expiresAt: string;
  expectedMemberCount: number;
  strictCompleteCount: number;
  expectedPublishedCount: number;
  publishedCount: number;
  controlledPreviewAccepted: boolean;
  stagedAccepted: boolean;
  ownerPromotionAccepted: boolean;
  cryptographicallyVerified: boolean;
  signerAuthorityVerified: boolean;
  currentBuildBindingsVerified: boolean;
  invalidationPolicy: string;
  releaseDefinitionSha256: string;
  completionLedgerSha256: string;
  releaseLedgerSha256: string;
  reviewDecisionSha256: string;
  ownerDecisionSha256: string;
  promotionReleaseBundleSha256: string;
}

const VERIFIED_PROMOTION_ADMISSIONS =
  new WeakSet<VerifiedLessonReleasePromotion>();

/**
 * Test-only constructor for exercising the final gate without adding a local
 * production signing or trust path. Production must eventually admit these
 * objects only from an external-trust adapter that actually verifies
 * EvidenceReceiptV1, signer authority/revocation, the chained promotion
 * bundle, and every current build binding.
 */
export function createVerifiedLessonReleasePromotionForTesting(
  claims: VerifiedLessonReleasePromotion,
): VerifiedLessonReleasePromotion {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('test-only promotion admission is disabled in production');
  }
  const admission = Object.freeze({...claims});
  VERIFIED_PROMOTION_ADMISSIONS.add(admission);
  return admission;
}

export interface LessonPublicationArtifactBindings {
  releaseManifest: string | null;
  releaseLedger: string | null;
  completionLedger: string | null;
}

export interface LessonReleaseState {
  releaseId: string;
  publicationMode: 'atomic';
  requiredMemberCount: number;
  strictCompleteMemberCount: number;
  published: boolean;
  promotionGateSatisfied: boolean;
  evidenceReceiptSha256: string | null;
  state: string;
  admittedMemberIds: readonly string[];
  missingMemberIds: readonly string[];
  diagnostics: readonly string[];
}

export interface PublicationCatalog {
  definitions: readonly LessonReleaseDefinition[];
  releases: readonly LessonReleaseState[];
  diagnostics: readonly string[];
  artifactSha256: Readonly<LessonPublicationArtifactBindings>;
}

export interface PublicationTarget {
  animationId: string;
  assetId: string;
  classification: {
    collection: string;
    grade: number | 'elementary' | null;
    lesson: number | null;
  };
  migration: {status: MigrationStatus; [key: string]: unknown};
}

export const G4_L3_ATOMIC_RELEASE_ID = 'lesson-g04-l03-negative-numbers';
export const G5_L4_ATOMIC_RELEASE_ID = 'lesson-g05-l04-number-lines';
export const G5_L5_ATOMIC_RELEASE_ID = 'lesson-g05-l05-add-subtract-negative-numbers';

interface ProtectedAtomicReleaseShape {
  readonly releaseId: string;
  readonly grade: number;
  readonly lesson: number;
  readonly activeXmlReferencedPages: number;
  readonly courseShells: number;
}

const PROTECTED_ATOMIC_RELEASE_SHAPES = Object.freeze([
  Object.freeze({
    releaseId: G4_L3_ATOMIC_RELEASE_ID,
    grade: 4,
    lesson: 3,
    activeXmlReferencedPages: 39,
    courseShells: 0,
  }),
  Object.freeze({
    releaseId: G5_L4_ATOMIC_RELEASE_ID,
    grade: 5,
    lesson: 4,
    activeXmlReferencedPages: 54,
    courseShells: 0,
  }),
  Object.freeze({
    releaseId: G5_L5_ATOMIC_RELEASE_ID,
    grade: 5,
    lesson: 5,
    activeXmlReferencedPages: 56,
    courseShells: 0,
  }),
]) satisfies readonly ProtectedAtomicReleaseShape[];

function protectedShapeForReleaseId(releaseId: string): ProtectedAtomicReleaseShape | undefined {
  return PROTECTED_ATOMIC_RELEASE_SHAPES.find((shape) => shape.releaseId === releaseId);
}

export function isProtectedAtomicReleaseId(releaseId: string): boolean {
  return protectedShapeForReleaseId(releaseId) !== undefined;
}

export function protectedAtomicReleaseIdForScope(
  grade: number | 'elementary' | null,
  lesson: number | null,
): string | undefined {
  return PROTECTED_ATOMIC_RELEASE_SHAPES.find(
    (shape) => shape.grade === grade && shape.lesson === lesson,
  )?.releaseId;
}

export function hasExactProtectedAtomicShape(definition: LessonReleaseDefinition): boolean {
  const shape = protectedShapeForReleaseId(definition.releaseId);
  if (!shape) return true;
  const expectedMemberCount = shape.activeXmlReferencedPages + shape.courseShells;
  if (definition.publicationMode !== 'atomic' ||
    definition.expectedMemberCount !== expectedMemberCount ||
    definition.scope.collection !== 'course' ||
    definition.scope.grade !== shape.grade ||
    definition.scope.lesson !== shape.lesson ||
    definition.scope.excludeNonMembers !== true ||
    definition.members.length !== expectedMemberCount) {
    return false;
  }
  return definition.members.every((member, index) =>
    member.releaseRole === (
      index < shape.activeXmlReferencedPages
        ? 'active-xml-referenced-page'
        : 'course-shell'
    ),
  );
}

export function hasExactG4L3AtomicShape(definition: LessonReleaseDefinition): boolean {
  return definition.releaseId === G4_L3_ATOMIC_RELEASE_ID &&
    hasExactProtectedAtomicShape(definition);
}

export function hasExactG5L4AtomicShape(definition: LessonReleaseDefinition): boolean {
  return definition.releaseId === G5_L4_ATOMIC_RELEASE_ID &&
    hasExactProtectedAtomicShape(definition);
}

export function hasExactG5L5AtomicShape(definition: LessonReleaseDefinition): boolean {
  return definition.releaseId === G5_L5_ATOMIC_RELEASE_ID &&
    hasExactProtectedAtomicShape(definition);
}

const compareText = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const SHA256 = /^[a-f0-9]{64}$/;
const EVIDENCE_RECEIPT_V1_TYPE = 'help-math-lesson-evidence-receipt-v1';
const EVIDENCE_RECEIPT_V1_INVALIDATION_POLICY = 'exact-hash-drift-closes-release-v1';

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort(compareText);
  const sortedRight = [...right].sort(compareText);
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function validatePromotionGate({
  artifactSha256,
  definition,
  nowMs,
  promotion,
  strictCompleteCount,
}: {
  artifactSha256: LessonPublicationArtifactBindings;
  definition: LessonReleaseDefinition;
  nowMs: number;
  promotion: VerifiedLessonReleasePromotion;
  strictCompleteCount: number;
}): {valid: boolean; diagnostics: string[]} {
  const diagnostics: string[] = [];
  const issuedAt = Date.parse(promotion.issuedAt);
  const expiresAt = Date.parse(promotion.expiresAt);
  if (!VERIFIED_PROMOTION_ADMISSIONS.has(promotion)) {
    diagnostics.push('promotion was not admitted by the trusted EvidenceReceiptV1 verifier');
  }
  if (promotion.releaseId !== definition.releaseId) diagnostics.push('promotion releaseId differs from the release manifest');
  if (promotion.promotionState !== 'owner-promoted') diagnostics.push('Owner promotion is not complete');
  if (promotion.evidenceType !== EVIDENCE_RECEIPT_V1_TYPE) diagnostics.push('promotion evidence is not EvidenceReceiptV1');
  if (!SHA256.test(promotion.evidenceReceiptSha256) || !SHA256.test(promotion.evidencePayloadSha256)) {
    diagnostics.push('EvidenceReceiptV1 hashes are malformed');
  }
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) ||
    expiresAt <= issuedAt || nowMs < issuedAt || nowMs >= expiresAt) {
    diagnostics.push('EvidenceReceiptV1 is not currently valid');
  }
  if (promotion.expectedMemberCount !== definition.expectedMemberCount ||
    promotion.strictCompleteCount !== strictCompleteCount ||
    promotion.strictCompleteCount !== definition.expectedMemberCount ||
    promotion.expectedPublishedCount !== 1 ||
    promotion.publishedCount !== 1) {
    diagnostics.push('EvidenceReceiptV1 release counts differ from current recomputation');
  }
  if (!promotion.controlledPreviewAccepted) diagnostics.push('Controlled Preview acceptance is missing');
  if (!promotion.stagedAccepted) diagnostics.push('Staged acceptance is missing');
  if (!promotion.ownerPromotionAccepted) diagnostics.push('Owner promotion acceptance is missing');
  if (!promotion.cryptographicallyVerified) diagnostics.push('EvidenceReceiptV1 signature is not verified');
  if (!promotion.signerAuthorityVerified) diagnostics.push('EvidenceReceiptV1 signer authority is not verified');
  if (!promotion.currentBuildBindingsVerified) diagnostics.push('EvidenceReceiptV1 current build bindings are not verified');
  if (promotion.invalidationPolicy !== EVIDENCE_RECEIPT_V1_INVALIDATION_POLICY) {
    diagnostics.push('EvidenceReceiptV1 invalidation policy is unsupported');
  }
  for (const [label, value] of [
    ['review decision', promotion.reviewDecisionSha256],
    ['Owner decision', promotion.ownerDecisionSha256],
    ['promotion release bundle', promotion.promotionReleaseBundleSha256],
  ] as const) {
    if (!SHA256.test(value)) diagnostics.push(`${label} hash is malformed`);
  }
  if (!artifactSha256.releaseManifest ||
    promotion.releaseDefinitionSha256 !== artifactSha256.releaseManifest) {
    diagnostics.push('EvidenceReceiptV1 release-definition binding drifted');
  }
  if (!artifactSha256.completionLedger ||
    promotion.completionLedgerSha256 !== artifactSha256.completionLedger) {
    diagnostics.push('EvidenceReceiptV1 completion-ledger binding drifted');
  }
  if (!artifactSha256.releaseLedger ||
    promotion.releaseLedgerSha256 !== artifactSha256.releaseLedger) {
    diagnostics.push('EvidenceReceiptV1 release-ledger binding drifted');
  }
  return {valid: diagnostics.length === 0, diagnostics};
}

/**
 * Recomputes each atomic release from asset-bound strict completion identities.
 * The generated release-ledger row is a required witness, never the source of
 * truth for the count or the public publication decision. Public publication
 * additionally requires one current, signer-authorized EvidenceReceiptV1 that
 * binds Controlled Preview, Staged, and Owner promotion to these exact ledgers.
 */
export function deriveLessonReleaseStates({
  artifactSha256 = {
    releaseManifest: null,
    releaseLedger: null,
    completionLedger: null,
  },
  bindingsCurrent,
  completions,
  definitions,
  ledgerEntries,
  nowMs = Date.now(),
  promotions = [],
}: {
  artifactSha256?: LessonPublicationArtifactBindings;
  bindingsCurrent: boolean;
  completions: readonly StrictCompletionIdentity[];
  definitions: readonly LessonReleaseDefinition[];
  ledgerEntries: readonly LessonReleaseLedgerEntry[];
  nowMs?: number;
  promotions?: readonly VerifiedLessonReleasePromotion[];
}): LessonReleaseState[] {
  const completionByAnimationId = new Map(completions.map((entry) => [entry.animationId, entry]));
  const ledgerByReleaseId = new Map(ledgerEntries.map((entry) => [entry.releaseId, entry]));

  return definitions.map((definition) => {
    const protectedShapeValid = hasExactProtectedAtomicShape(definition);
    const recomputedMembers = definition.members.map((member) => {
      const completion = completionByAnimationId.get(member.animationId);
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
    const admittedMemberIds = recomputedMembers
      .filter((member) => member.strictComplete)
      .map((member) => member.animationId);
    const admitted = new Set(admittedMemberIds);
    const missingMemberIds = definition.members
      .filter((member) => !admitted.has(member.animationId))
      .map((member) => member.animationId);
    const missingCount = recomputedMembers.filter((member) => member.status === 'missing').length;
    const assetMismatchCount = recomputedMembers.filter((member) => member.status === 'asset-mismatch').length;
    const recomputedPublished =
      protectedShapeValid &&
      definition.publicationMode === 'atomic' &&
      definition.members.length === definition.expectedMemberCount &&
      admittedMemberIds.length === definition.expectedMemberCount &&
      missingCount === 0 &&
      assetMismatchCount === 0;
    const ledger = ledgerByReleaseId.get(definition.releaseId);
    const diagnostics: string[] = [];
    const matchingPromotions = promotions.filter(
      (promotion) => promotion.releaseId === definition.releaseId,
    );
    let promotionGateSatisfied = false;
    let evidenceReceiptSha256: string | null = null;

    if (!protectedShapeValid) diagnostics.push('protected atomic lesson release shape is invalid');
    if (!bindingsCurrent) diagnostics.push('release-ledger source bindings are stale or invalid');
    if (!ledger) diagnostics.push('release-ledger entry is missing');
    if (ledger && ledger.publicationMode !== definition.publicationMode) diagnostics.push('publication mode differs from the release manifest');
    if (ledger && ledger.expectedMemberCount !== definition.expectedMemberCount) diagnostics.push('expected member count differs from the release manifest');
    if (ledger && ledger.strictCompleteCount !== admittedMemberIds.length) diagnostics.push('strict-complete member count differs from recomputation');
    if (ledger && ledger.missingCount !== missingCount) diagnostics.push('missing member count differs from recomputation');
    if (ledger && ledger.assetMismatchCount !== assetMismatchCount) diagnostics.push('asset-mismatch count differs from recomputation');
    if (ledger && ledger.published !== recomputedPublished) diagnostics.push('published flag differs from recomputation');
    if (ledger && (
      ledger.gate.kind !== 'atomic-all-members-strict' ||
      ledger.gate.requiredCount !== definition.expectedMemberCount ||
      ledger.gate.admittedCount !== admittedMemberIds.length ||
      ledger.gate.open !== recomputedPublished
    )) diagnostics.push('release gate differs from recomputation');
    if (ledger) {
      const ledgerByMemberId = new Map(ledger.members.map((member) => [member.animationId, member]));
      if (ledgerByMemberId.size !== ledger.members.length ||
        !sameMembers(ledger.members.map((member) => member.animationId), definition.members.map((member) => member.animationId))) {
        diagnostics.push('release-ledger member set differs from the release manifest');
      } else if (recomputedMembers.some((member) => {
        const witness = ledgerByMemberId.get(member.animationId);
        return !witness ||
          witness.assetId !== member.assetId ||
          witness.strictComplete !== member.strictComplete ||
          witness.status !== member.status ||
          witness.ledgerAssetId !== member.ledgerAssetId;
      })) {
        diagnostics.push('release-ledger member evidence differs from recomputation');
      }
    }
    if (matchingPromotions.length === 0) {
      diagnostics.push('verified EvidenceReceiptV1 Owner promotion is missing');
    } else if (matchingPromotions.length !== 1) {
      diagnostics.push('verified EvidenceReceiptV1 Owner promotion is not unique');
    } else {
      const promotion = matchingPromotions[0]!;
      const result = validatePromotionGate({
        artifactSha256,
        definition,
        nowMs,
        promotion,
        strictCompleteCount: admittedMemberIds.length,
      });
      diagnostics.push(...result.diagnostics);
      promotionGateSatisfied = result.valid;
      evidenceReceiptSha256 = result.valid
        ? promotion.evidenceReceiptSha256
        : null;
    }

    return Object.freeze({
      releaseId: definition.releaseId,
      publicationMode: definition.publicationMode,
      requiredMemberCount: definition.expectedMemberCount,
      strictCompleteMemberCount: admittedMemberIds.length,
      published: Boolean(
        bindingsCurrent &&
        ledger &&
        recomputedPublished &&
        promotionGateSatisfied &&
        diagnostics.length === 0
      ),
      promotionGateSatisfied,
      evidenceReceiptSha256,
      state: ledger?.status ?? 'unavailable',
      admittedMemberIds: Object.freeze(admittedMemberIds),
      missingMemberIds: Object.freeze(missingMemberIds),
      diagnostics: Object.freeze(diagnostics),
    });
  });
}

function scopeControls(target: PublicationTarget, scope: LessonReleaseScope): boolean {
  return scope.excludeNonMembers &&
    target.classification.collection === scope.collection &&
    target.classification.grade === scope.grade &&
    target.classification.lesson === scope.lesson;
}

/**
 * Technical strict completion and public eligibility are deliberately separate.
 * An item inside a controlled lesson scope must be an exact release member and
 * the whole atomic release must be published. Strict items outside every
 * controlled scope retain the existing individual-publication behavior.
 */
export function isTargetPublished(target: PublicationTarget, publication: PublicationCatalog): boolean {
  if (target.migration.status !== 'complete') return false;
  const memberDefinitions = publication.definitions.filter((definition) =>
    definition.members.some((member) => member.animationId === target.animationId),
  );
  if (memberDefinitions.length > 0) {
    return memberDefinitions.some((definition) => {
      const exactMember = definition.members.some(
        (member) => member.animationId === target.animationId && member.assetId === target.assetId,
      );
      const release = publication.releases.find((entry) => entry.releaseId === definition.releaseId);
      return exactMember && release?.published === true;
    });
  }

  const protectedReleaseId = protectedAtomicReleaseIdForScope(
    target.classification.grade,
    target.classification.lesson,
  );
  if (target.classification.collection === 'course' && protectedReleaseId) {
    const protectedDefinition = publication.definitions.find(
      (definition) => definition.releaseId === protectedReleaseId,
    );
    if (!protectedDefinition || !hasExactProtectedAtomicShape(protectedDefinition)) return false;
    const exactMember = protectedDefinition.members.some(
      (member) => member.animationId === target.animationId && member.assetId === target.assetId,
    );
    const release = publication.releases.find((entry) => entry.releaseId === protectedReleaseId);
    return exactMember && release?.published === true;
  }

  const controllingDefinitions = publication.definitions.filter((definition) => scopeControls(target, definition.scope));
  if (controllingDefinitions.length === 0) return true;

  return controllingDefinitions.some((definition) => {
    const exactMember = definition.members.some(
      (member) => member.animationId === target.animationId && member.assetId === target.assetId,
    );
    const release = publication.releases.find((entry) => entry.releaseId === definition.releaseId);
    return exactMember && release?.published === true;
  });
}

export function isReleasePublished(publication: PublicationCatalog, releaseId: string): boolean {
  return publication.releases.find((release) => release.releaseId === releaseId)?.published === true;
}
