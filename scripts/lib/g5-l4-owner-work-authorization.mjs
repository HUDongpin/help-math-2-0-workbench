import {createHash} from "node:crypto";

export const G5_L4_RELEASE_ID = "lesson-g05-l04-number-lines";
export const G5_L4_OWNER_WORK_AUTHORIZATION_PATH =
  "catalog/owner-authorizations/g5-l4-owner-continuation-and-prospective-approval-intake-2026-08-01.json";
export const G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT =
  "继续目前goal剩下的任务。需要批准的地方，我现在全部批准。";
export const G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT_BYTES = 82;
export const G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT_SHA256 =
  "cc196f4b252e88f8ed2ca1bcf56204c1d23d02d81abc00056ac667517554748a";
export const G5_L4_RELEASE_FINGERPRINT_SHA256 =
  "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc";

const SHA256 = /^[a-f0-9]{64}$/;
const STRICT_ACCEPTANCE_EFFECT =
  "none; prospective work authorization and approval intent only";
const RUNTIME_EXECUTION_WORK_AUTHORIZATION_BASIS =
  "user-attested-prospective-owner-direction";

const SOURCE_BINDINGS = Object.freeze({
  releaseManifest: Object.freeze({
    path: "catalog/lesson-releases.json",
    bytes: 87864,
    sha256:
      "f3caa2ae0e9bfd6c02dd846aa2d45de5c2f746cc57ba01a09e506d4d3c42d632",
    releaseEntryFingerprintSha256: G5_L4_RELEASE_FINGERPRINT_SHA256,
  }),
  m1Authorization: Object.freeze({
    path:
      "catalog/owner-authorizations/g5-l4-m1-owner-authorization-2026-07-28.json",
    bytes: 2375,
    sha256:
      "7469ec586d8cadb6c5459609e46e0010a8041a4e9fe226e82912bd339d9f5afb",
  }),
  ownerDefaultBlockersAuthorization: Object.freeze({
    path:
      "catalog/owner-authorizations/g5-l4-owner-default-blockers-2-4-authorization-2026-07-29.json",
    bytes: 6122,
    sha256:
      "2faf0bd0cdbfaf47c3efc9b7f0e332d1d82ba9b72a8222b1cdf31bbe065cc77d",
  }),
  currentJsImplementationAuthorization: Object.freeze({
    path:
      "catalog/owner-authorizations/g5-l4-current-js-implementation-authorization-2026-07-29.json",
    bytes: 3508,
    sha256:
      "56b49ba928de107246192e2a71fdb803e80299d61eb3c93f7ed4b5fb32fc358c",
  }),
  combinedKeytermsProductReferenceSuccessor: Object.freeze({
    path:
      "catalog/owner-authorizations/g5-l4-combined-keyterms-product-reference-successor-2026-07-30.json",
    bytes: 7719,
    sha256:
      "20a7b051fc59d13427069382d0a411da8408d4ddd3cf02a08a769c1302994c07",
  }),
});

const FALSE_AUTHORIZATION_FIELDS = Object.freeze([
  "implementationAcceptanceEstablished",
  "technicalMechanismsApproved",
  "technicalMechanismsVerified",
  "runtimeHostApproved",
  "immutableSessionAuthorizationEstablished",
  "runtimeExecutionAuthorized",
  "lessonSpecificSubstitution",
  "authoritativeOriginalRuntimeEvidenceEstablished",
  "independentHumanReviewAccepted",
  "ownerFidelityAcceptanceEstablished",
  "strictValidationApprovalEstablished",
  "strictCompletionEstablished",
  "publicationAuthorized",
  "published",
]);

const FALSE_PROJECTION_FIELDS = Object.freeze([
  "implementationAcceptanceEstablished",
  "technicalMechanismsApproved",
  "technicalMechanismsVerified",
  "runtimeHostApproved",
  "immutableSessionAuthorizationEstablished",
  "runtimeExecutionAuthorized",
  "lessonSpecificSubstitution",
  "authoritativeOriginalRuntimeEvidenceEstablished",
  "independentHumanReviewAccepted",
  "ownerFidelityAcceptanceEstablished",
  "fidelityAccepted",
  "strictValidationApproved",
  "strictComplete",
  "publicationAuthorized",
  "published",
]);

const PROTECTED_GATE_TRUE_FIELDS = Object.freeze(new Set([
  "implementationAcceptanceEstablished",
  "technicalMechanismsApproved",
  "technicalMechanismsVerified",
  "runtimeHostApproved",
  "immutableSessionAuthorizationEstablished",
  "immutablePerSessionAuthorizationPresent",
  "runtimeExecutionAuthorized",
  "animateGuiExecutionAuthorized",
  "originalRuntimeExecutionAuthorized",
  "actualAnimateExecutionEstablished",
  "actualOriginalRuntimeSessionEstablished",
  "lessonSpecificSubstitution",
  "authoritativeOriginalRuntimeEvidenceEstablished",
  "authoritativeOriginalRuntime",
  "animateAuditAccepted",
  "audioAccepted",
  "authoringAccepted",
  "behaviorAccepted",
  "fullFrameAccepted",
  "humanReviewAccepted",
  "independentHumanReviewAccepted",
  "reviewAccepted",
  "ownerFidelityAccepted",
  "ownerFidelityAcceptanceEstablished",
  "fidelityAccepted",
  "rmseAccepted",
  "implementationAuthorized",
  "implementationComplete",
  "strictValidationApprovalEstablished",
  "strictValidationApproved",
  "strictCompletionEstablished",
  "strictComplete",
  "publicationAuthorized",
  "publicReleaseAuthorized",
  "externalDeploymentAuthorized",
  "published",
  "sourceGapClosed",
  "sessionExecuted",
  "runnable",
]));

const PROJECTION_KEYS = Object.freeze([
  "receipt",
  "ownerFullName",
  "identityBasis",
  "statement",
  "remainingInScopeMachineWorkAuthorized",
  "implementationWorkAuthorized",
  "runtimeExecutionWorkAuthorized",
  "runtimeExecutionWorkAuthorizationBasis",
  "technicalMechanismSelectionAndImplementationWorkAuthorized",
  "validatorSupportedSourceGapExceptionPreparationAuthorized",
  "currentJsPrivatePreviewAuthorizationReaffirmed",
  "combinedKeytermsProductReferenceAuthorizationReaffirmed",
  "prospectiveApprovalIntentRecorded",
  "implementationAuthorizedCountEffect",
  ...FALSE_PROJECTION_FIELDS,
  "strictAcceptanceEffect",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertExactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()),
    `${label} keys drifted`,
  );
}

function assertDescriptor(actual, expected, label) {
  assertExactKeys(actual, Object.keys(expected), label);
  for (const [key, value] of Object.entries(expected)) {
    invariant(actual[key] === value, `${label}.${key} drifted`);
  }
}

function assertAllFalse(value, fields, label) {
  for (const field of fields) {
    invariant(value?.[field] === false, `${label}.${field} must remain false`);
  }
}

export function assertNoG5L4ProtectedGatePromotion(
  value,
  {label = "G5 L4 report"} = {},
) {
  const ancestors = new WeakSet();
  const visit = (current, currentPath) => {
    if (!current || typeof current !== "object") return;
    invariant(
      !ancestors.has(current),
      `${label}.${currentPath || "<root>"} contains a cycle`,
    );
    ancestors.add(current);
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${currentPath}[${index}]`));
      ancestors.delete(current);
      return;
    }
    for (const [key, child] of Object.entries(current)) {
      const childPath = currentPath ? `${currentPath}.${key}` : key;
      invariant(
        !(PROTECTED_GATE_TRUE_FIELDS.has(key) && child === true),
        `${label}.${childPath} protected gate must remain false`,
      );
      visit(child, childPath);
    }
    ancestors.delete(current);
  };
  visit(value, "");
  return value;
}

function currentReleaseFingerprint(releaseManifest) {
  invariant(
    releaseManifest?.schemaVersion === 1 && Array.isArray(releaseManifest.releases),
    "Owner work authorization release manifest is malformed",
  );
  const matches = releaseManifest.releases.filter(
    (release) => release?.releaseId === G5_L4_RELEASE_ID,
  );
  invariant(matches.length === 1, "Owner work authorization release entry is not unique");
  return sha256(Buffer.from(stableJson(matches[0])));
}

export function validateG5L4OwnerWorkAuthorizationReceipt(
  receipt,
  {releaseManifest = null} = {},
) {
  assertExactKeys(
    receipt,
    [
      "schemaVersion",
      "evidenceType",
      "releaseId",
      "receivedOn",
      "recordedAt",
      "channel",
      "taskThreadId",
      "statementLanguage",
      "ownerStatement",
      "ownerIdentity",
      "authorization",
      "sourceBindingsAtIntake",
      "externalSignatureEnvelope",
      "authorityBoundary",
    ],
    "Owner work authorization receipt",
  );
  invariant(receipt?.schemaVersion === 1, "Owner work authorization schemaVersion drifted");
  invariant(
    receipt.evidenceType ===
      "g5-l4-user-stated-owner-continuation-and-prospective-approval-intake",
    "Owner work authorization evidenceType drifted",
  );
  invariant(receipt.releaseId === G5_L4_RELEASE_ID, "Owner work authorization releaseId drifted");
  invariant(receipt.receivedOn === "2026-08-01", "Owner work authorization receivedOn drifted");
  invariant(receipt.recordedAt === "2026-08-01T03:52:03Z", "Owner work authorization recordedAt drifted");
  invariant(receipt.channel === "current-codex-task", "Owner work authorization channel drifted");
  invariant(
    receipt.taskThreadId === "019f9f44-c13b-7033-92d0-3658e2f9c638",
    "Owner work authorization task thread drifted",
  );
  invariant(receipt.statementLanguage === "zh-CN", "Owner work authorization language drifted");
  assertExactKeys(
    receipt.ownerStatement,
    ["exactUtf8", "byteLength", "sha256", "captureBoundary"],
    "Owner work authorization statement",
  );
  assertExactKeys(
    receipt.ownerIdentity,
    ["ownerFullName", "ownerRole", "externalSubjectId"],
    "Owner work authorization identity",
  );
  invariant(
    receipt.ownerStatement?.exactUtf8 === G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT,
    "Owner work authorization statement drifted",
  );
  const statementBytes = Buffer.from(receipt.ownerStatement.exactUtf8, "utf8");
  invariant(
    statementBytes.length === G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT_BYTES &&
      receipt.ownerStatement.byteLength === G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT_BYTES &&
      sha256(statementBytes) === G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT_SHA256 &&
      receipt.ownerStatement.sha256 === G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT_SHA256 &&
      receipt.ownerStatement.captureBoundary ===
        "exact-visible-user-message-markdown-source",
    "Owner work authorization statement binding drifted",
  );
  invariant(
    receipt.ownerIdentity?.ownerFullName === "Dr. Peter Hu" &&
      receipt.ownerIdentity.ownerRole === "Owner" &&
      receipt.ownerIdentity.externalSubjectId === null,
    "Owner work authorization identity drifted",
  );

  const authorization = receipt.authorization;
  assertExactKeys(
    authorization,
    [
      "remainingInScopeMachineWorkAuthorized",
      "implementationWorkAuthorized",
      "runtimeExecutionWorkAuthorized",
      "runtimeExecutionWorkAuthorizationBasis",
      "technicalMechanismSelectionAndImplementationWorkAuthorized",
      "validatorSupportedSourceGapExceptionPreparationAuthorized",
      "currentJsPrivatePreviewAuthorizationReaffirmed",
      "combinedKeytermsProductReferenceAuthorizationReaffirmed",
      "prospectiveApprovalIntentRecorded",
      ...FALSE_AUTHORIZATION_FIELDS,
    ],
    "Owner work authorization authorization",
  );
  invariant(
    authorization?.remainingInScopeMachineWorkAuthorized === true &&
      authorization.implementationWorkAuthorized === true &&
      authorization.runtimeExecutionWorkAuthorized === true &&
      authorization.runtimeExecutionWorkAuthorizationBasis ===
        RUNTIME_EXECUTION_WORK_AUTHORIZATION_BASIS &&
      authorization.technicalMechanismSelectionAndImplementationWorkAuthorized === true &&
      authorization.validatorSupportedSourceGapExceptionPreparationAuthorized === true &&
      authorization.currentJsPrivatePreviewAuthorizationReaffirmed === true &&
      authorization.combinedKeytermsProductReferenceAuthorizationReaffirmed === true &&
      authorization.prospectiveApprovalIntentRecorded === true,
    "Owner work authorization positive work-permission scope drifted",
  );
  assertAllFalse(
    authorization,
    FALSE_AUTHORIZATION_FIELDS,
    "Owner work authorization acceptance boundary",
  );

  const sourceBindings = receipt.sourceBindingsAtIntake;
  assertExactKeys(sourceBindings, Object.keys(SOURCE_BINDINGS), "Owner work authorization source bindings");
  for (const [key, expected] of Object.entries(SOURCE_BINDINGS)) {
    assertDescriptor(sourceBindings[key], expected, `Owner work authorization ${key}`);
  }
  if (releaseManifest) {
    invariant(
      currentReleaseFingerprint(releaseManifest) === G5_L4_RELEASE_FINGERPRINT_SHA256,
      "Owner work authorization current G5 L4 release fingerprint drifted",
    );
  }

  invariant(receipt.externalSignatureEnvelope === null, "Owner work authorization invented an external signature");
  const boundary = receipt.authorityBoundary;
  assertExactKeys(
    boundary,
    [
      "ownerIdentityUserAttested",
      "ownerIdentityCryptographicallyVerified",
      "continuationAuthorizationRecorded",
      "implementationWorkAuthorized",
      "runtimeExecutionWorkAuthorized",
      "runtimeExecutionWorkAuthorizationBasis",
      "prospectiveApprovalIntentRecorded",
      "implementationAuthorizedCountEffect",
      "technicalMechanismsSelected",
      ...FALSE_AUTHORIZATION_FIELDS,
      "strictAcceptanceEffect",
    ],
    "Owner work authorization authority boundary",
  );
  invariant(
    boundary?.ownerIdentityUserAttested === true &&
      boundary.ownerIdentityCryptographicallyVerified === false &&
      boundary.continuationAuthorizationRecorded === true &&
      boundary.implementationWorkAuthorized === true &&
      boundary.runtimeExecutionWorkAuthorized === true &&
      boundary.runtimeExecutionWorkAuthorizationBasis ===
        RUNTIME_EXECUTION_WORK_AUTHORIZATION_BASIS &&
      boundary.prospectiveApprovalIntentRecorded === true &&
      boundary.implementationAuthorizedCountEffect === 0 &&
      boundary.technicalMechanismsSelected === 0 &&
      boundary.strictAcceptanceEffect === STRICT_ACCEPTANCE_EFFECT,
    "Owner work authorization authority boundary drifted",
  );
  assertAllFalse(
    boundary,
    FALSE_AUTHORIZATION_FIELDS,
    "Owner work authorization authority boundary",
  );
  return receipt;
}

export function projectG5L4OwnerWorkAuthorization(receipt, receiptDescriptor) {
  validateG5L4OwnerWorkAuthorizationReceipt(receipt);
  invariant(
    receiptDescriptor?.path === G5_L4_OWNER_WORK_AUTHORIZATION_PATH &&
      Number.isInteger(receiptDescriptor.bytes) &&
      receiptDescriptor.bytes > 0 &&
      SHA256.test(receiptDescriptor.sha256 || ""),
    "Owner work authorization receipt descriptor drifted",
  );
  return {
    receipt: {
      path: receiptDescriptor.path,
      bytes: receiptDescriptor.bytes,
      sha256: receiptDescriptor.sha256,
    },
    ownerFullName: "Dr. Peter Hu",
    identityBasis: "user-attested-current-codex-task",
    statement: {
      captureBoundary: receipt.ownerStatement.captureBoundary,
      byteLength: G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT_BYTES,
      sha256: G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT_SHA256,
    },
    remainingInScopeMachineWorkAuthorized: true,
    implementationWorkAuthorized: true,
    runtimeExecutionWorkAuthorized: true,
    runtimeExecutionWorkAuthorizationBasis:
      RUNTIME_EXECUTION_WORK_AUTHORIZATION_BASIS,
    technicalMechanismSelectionAndImplementationWorkAuthorized: true,
    validatorSupportedSourceGapExceptionPreparationAuthorized: true,
    currentJsPrivatePreviewAuthorizationReaffirmed: true,
    combinedKeytermsProductReferenceAuthorizationReaffirmed: true,
    prospectiveApprovalIntentRecorded: true,
    implementationAuthorizedCountEffect: 0,
    implementationAcceptanceEstablished: false,
    technicalMechanismsApproved: false,
    technicalMechanismsVerified: false,
    runtimeHostApproved: false,
    immutableSessionAuthorizationEstablished: false,
    runtimeExecutionAuthorized: false,
    lessonSpecificSubstitution: false,
    authoritativeOriginalRuntimeEvidenceEstablished: false,
    independentHumanReviewAccepted: false,
    ownerFidelityAcceptanceEstablished: false,
    fidelityAccepted: false,
    strictValidationApproved: false,
    strictComplete: false,
    publicationAuthorized: false,
    published: false,
    strictAcceptanceEffect: STRICT_ACCEPTANCE_EFFECT,
  };
}

export function validateG5L4OwnerWorkAuthorizationProjection(
  projection,
  expectedReceiptDescriptor,
) {
  assertExactKeys(
    projection,
    PROJECTION_KEYS,
    "Owner work authorization projection",
  );
  assertExactKeys(
    projection.receipt,
    ["path", "bytes", "sha256"],
    "Owner work authorization projection receipt",
  );
  assertExactKeys(
    projection.statement,
    ["captureBoundary", "byteLength", "sha256"],
    "Owner work authorization projection statement",
  );
  invariant(
    projection?.receipt?.path === expectedReceiptDescriptor?.path &&
      projection.receipt.bytes === expectedReceiptDescriptor.bytes &&
      projection.receipt.sha256 === expectedReceiptDescriptor.sha256,
    "Owner work authorization projection receipt drifted",
  );
  invariant(
    projection.ownerFullName === "Dr. Peter Hu" &&
      projection.identityBasis === "user-attested-current-codex-task" &&
      projection.statement?.captureBoundary ===
        "exact-visible-user-message-markdown-source" &&
      projection.statement.byteLength === G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT_BYTES &&
      projection.statement.sha256 === G5_L4_OWNER_WORK_AUTHORIZATION_STATEMENT_SHA256 &&
      projection.remainingInScopeMachineWorkAuthorized === true &&
      projection.implementationWorkAuthorized === true &&
      projection.runtimeExecutionWorkAuthorized === true &&
      projection.runtimeExecutionWorkAuthorizationBasis ===
        RUNTIME_EXECUTION_WORK_AUTHORIZATION_BASIS &&
      projection.technicalMechanismSelectionAndImplementationWorkAuthorized === true &&
      projection.validatorSupportedSourceGapExceptionPreparationAuthorized === true &&
      projection.currentJsPrivatePreviewAuthorizationReaffirmed === true &&
      projection.combinedKeytermsProductReferenceAuthorizationReaffirmed === true &&
      projection.prospectiveApprovalIntentRecorded === true &&
      projection.implementationAuthorizedCountEffect === 0 &&
      projection.strictAcceptanceEffect === STRICT_ACCEPTANCE_EFFECT,
    "Owner work authorization projection work-permission scope drifted",
  );
  assertAllFalse(
    projection,
    FALSE_PROJECTION_FIELDS,
    "Owner work authorization projection acceptance boundary",
  );
  return projection;
}

export function projectG5L4PublicSafeOwnerWorkAuthorization(
  receipt,
  receiptDescriptor,
) {
  const projection = projectG5L4OwnerWorkAuthorization(
    receipt,
    receiptDescriptor,
  );
  const {ownerFullName: redactedOwnerFullName, ...publicProjection} = projection;
  invariant(
    redactedOwnerFullName === "Dr. Peter Hu",
    "Owner work authorization public projection identity drifted",
  );
  return {
    ...publicProjection,
    ownerIdentityRedacted: true,
  };
}

export function validateG5L4PublicSafeOwnerWorkAuthorizationProjection(
  projection,
  expectedReceiptDescriptor,
) {
  assertExactKeys(
    projection,
    PROJECTION_KEYS.map((key) =>
      key === "ownerFullName" ? "ownerIdentityRedacted" : key,
    ),
    "Owner work authorization public projection",
  );
  invariant(
    projection?.ownerIdentityRedacted === true &&
      projection.ownerFullName === undefined,
    "Owner work authorization public projection exposed identity",
  );
  const {ownerIdentityRedacted, ...rest} = projection;
  void ownerIdentityRedacted;
  validateG5L4OwnerWorkAuthorizationProjection(
    {...rest, ownerFullName: "Dr. Peter Hu"},
    expectedReceiptDescriptor,
  );
  return projection;
}
