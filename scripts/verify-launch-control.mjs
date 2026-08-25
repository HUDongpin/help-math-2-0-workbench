#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const controlRoot = path.join(projectRoot, 'catalog', 'launch-control');

export const LIFECYCLE_STATES = Object.freeze([
  'QUEUED',
  'LEASED',
  'IMPLEMENTED',
  'LOCAL_VERIFIED',
  'INDEPENDENT_REVIEWED',
  'INTEGRATED',
  'PREVIEW_VERIFIED',
  'HUMAN_SIGNED',
  'STAGED_PRODUCTION_VERIFIED',
  'PROMOTED',
  'OBSERVED',
]);

const RESULT_STATES = new Set(['PASS', 'FAIL', 'BLOCKED', 'QUARANTINED', null]);
const GATE_NAMES = ['currentJs', 'strict', 'preview', 'released', 'production'];
const REQUIRED_REVIEWER_ROLES = Object.freeze([
  'accessibility',
  'englishSpanishMathInstruction',
  'legalPrivacy',
  'owner',
]);
const PROMOTION_HARD_GATE_NAMES = Object.freeze([
  'accessibilityGate',
  'browserMatrixGate',
  'cleanReleaseWorktree',
  'cleanRoomReleaseSuite',
  'exactArtifactIdentity',
  'finalRecheckNoDrift',
  'fortyEightHourSoak',
  'githubHostedCi',
  'independentReview',
  'instantRollbackRehearsed',
  'lastKnownGoodFrozen',
  'legalPagesFinal',
  'licenseGate',
  'mainProtectionAndRequiredChecks',
  'minimumTwoPreviewLessons',
  'performanceGate',
  'productionSmokeGate',
  'publicFeaturesFailClosed',
  'publicSurfaceConsistency',
  'repositoryPrivate',
  'sbomGate',
  'secretAndPrivatePathGate',
  'stagedDeploymentReady',
  'supportMailboxTwoWayVerified',
  'zeroP0P1',
]);
const DISABLED_PUBLIC_FEATURE_NAMES = Object.freeze([
  'auth',
  'contactForm',
  'family',
  'lrs',
  'novaTutor',
  'teacher',
]);
const PROMOTION_FIELDS = Object.freeze([
  'automaticPromotionAllowed',
  'exactCommit',
  'exactTree',
  'finalAuthorizationReceiptSha256',
  'lastKnownGoodDeploymentId',
  'launchManifestSha256',
  'productionDomains',
  'rollbackReceiptSha256',
  'rollbackThresholdsReceiptSha256',
  'runtimeAssetClosureSha256',
  'stagedDeploymentId',
  'stagedDeploymentReceiptSha256',
  'timeZone',
  'windowEndsAt',
  'windowStartsAt',
]);
const BOUND_EXTERNAL_RECEIPT_NAMES = Object.freeze([
  'c0002CorrectRepositoryReviewSha256',
  'c0002WrongTargetSupersessionSha256',
  'c0003PageOnlySpineReviewSha256',
  'c0004DeployClosureReviewSha256',
  'c0005AnimationRuntimeAudioPassiveLoopReviewSha256',
  'c0005IntegratedSuccessorIndependentReviewSha256',
  'c0005LocalExecutionV2Sha256',
  'c0005ResponsiveHostedFailureQuarantineSha256',
  'c0005SiteRuntimeFailClosedGateReviewSha256',
  'c0005StagedSecretSecurityPrecommitReviewSha256',
  'githubProductionEnvironmentBoundarySha256',
  'ownerInputsSha256',
]);
const REQUIRED_TASK_FIELDS = [
  'taskId',
  'objective',
  'priority',
  'lane',
  'releaseBlocking',
  'requiredTerminalState',
  'baseCommit',
  'baseTree',
  'worktree',
  'branch',
  'readSet',
  'changedPathAllowlist',
  'predecessorReceiptHashes',
  'allowedTools',
  'forbiddenActions',
  'verificationCommands',
  'acceptanceCriteria',
  'lease',
  'output',
  'producer',
  'independentReviewer',
  'status',
  'result',
  'gateEffects',
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  invariant(
    JSON.stringify(actual) === JSON.stringify(sortedExpected),
    `${label} fields must be exactly: ${sortedExpected.join(',')}`,
  );
}

function isSha256(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
}

function isCommit(value) {
  return typeof value === 'string' && /^[a-f0-9]{40}$/u.test(value);
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function git(args) {
  return execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  }).trim();
}

function gitResult(args) {
  const child = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  if (child.error) throw child.error;
  return {
    status: child.status,
    stdout: (child.stdout ?? '').trim(),
    stderr: (child.stderr ?? '').trim(),
  };
}

export function verifyRejectedCommitProof({objectStatus, ancestryStatus}) {
  invariant(objectStatus === 0, 'rejected mixed commit object is unavailable');
  invariant(
    ancestryStatus === 0 || ancestryStatus === 1,
    'rejected mixed commit ancestry could not be verified',
  );
  invariant(ancestryStatus === 1, 'rejected mixed commit became an ancestor of release HEAD');
  return true;
}

export function verifyTaskContract(task) {
  for (const field of REQUIRED_TASK_FIELDS) {
    invariant(Object.hasOwn(task, field), `${task.taskId ?? '<unknown>'}: missing ${field}`);
  }
  invariant(/^[A-Z0-9][A-Z0-9-]+$/u.test(task.taskId), `${task.taskId}: invalid taskId`);
  invariant(typeof task.releaseBlocking === 'boolean', `${task.taskId}: releaseBlocking must be boolean`);
  invariant(
    LIFECYCLE_STATES.includes(task.requiredTerminalState),
    `${task.taskId}: invalid requiredTerminalState`,
  );
  invariant(LIFECYCLE_STATES.includes(task.status), `${task.taskId}: invalid lifecycle status`);
  invariant(RESULT_STATES.has(task.result), `${task.taskId}: invalid result`);
  for (const field of [
    'readSet',
    'changedPathAllowlist',
    'predecessorReceiptHashes',
    'allowedTools',
    'forbiddenActions',
    'verificationCommands',
    'acceptanceCriteria',
  ]) {
    invariant(Array.isArray(task[field]), `${task.taskId}: ${field} must be an array`);
  }
  invariant(
    Number.isInteger(task.lease.attemptCount) && task.lease.attemptCount >= 0,
    `${task.taskId}: invalid lease attempt count`,
  );
  invariant(Array.isArray(task.output.artifactHashes), `${task.taskId}: artifactHashes must be an array`);
  invariant(
    task.output.artifactHashes.every(
      (artifact) => typeof artifact === 'string' && artifact.length > 0,
    ),
    `${task.taskId}: artifactHashes must contain non-empty strings`,
  );
  invariant(
    new Set(task.output.artifactHashes).size === task.output.artifactHashes.length,
    `${task.taskId}: artifactHashes must not contain duplicates`,
  );
  for (const gate of GATE_NAMES) {
    invariant(
      typeof task.gateEffects[gate] === 'boolean',
      `${task.taskId}: gateEffects.${gate} must be boolean`,
    );
  }
  if (task.result === 'PASS') {
    invariant(
      LIFECYCLE_STATES.indexOf(task.status) >= LIFECYCLE_STATES.indexOf('LOCAL_VERIFIED'),
      `${task.taskId}: PASS cannot precede LOCAL_VERIFIED`,
    );
    if (
      LIFECYCLE_STATES.indexOf(task.status) >=
      LIFECYCLE_STATES.indexOf('INDEPENDENT_REVIEWED')
    ) {
      invariant(
        typeof task.producer === 'string' &&
          typeof task.independentReviewer === 'string' &&
          task.producer.length > 0 &&
          task.independentReviewer.length > 0 &&
          task.producer !== task.independentReviewer,
        `${task.taskId}: independently reviewed PASS requires distinct producer and reviewer`,
      );
    }
  }
  return true;
}

export function verifyBacklog(backlog) {
  invariant(backlog.schemaVersion === 1, 'backlog schemaVersion must be 1');
  invariant(backlog.releaseId === 'HELP_MATH_2_PUBLIC_LAUNCH_V1', 'unexpected releaseId');
  invariant(
    JSON.stringify(backlog.stateMachine) === JSON.stringify(LIFECYCLE_STATES),
    'state machine drifted',
  );
  invariant(Array.isArray(backlog.tasks) && backlog.tasks.length > 0, 'backlog must contain tasks');
  const identifiers = new Set();
  for (const task of backlog.tasks) {
    verifyTaskContract(task);
    invariant(!identifiers.has(task.taskId), `duplicate taskId: ${task.taskId}`);
    identifiers.add(task.taskId);
  }
  return {
    taskCount: backlog.tasks.length,
    releaseBlockingIncompleteCount: backlog.tasks.filter(
      (task) =>
        task.releaseBlocking &&
        (
          task.result !== 'PASS' ||
          LIFECYCLE_STATES.indexOf(task.status) <
            LIFECYCLE_STATES.indexOf(task.requiredTerminalState)
        ),
    ).length,
  };
}

export function verifyActiveTaskChangedPathOwnership(backlog, changedPaths) {
  invariant(Array.isArray(changedPaths), 'working changed paths must be an array');
  invariant(
    changedPaths.every((changedPath) => typeof changedPath === 'string' && changedPath.length > 0),
    'working changed paths must contain non-empty strings',
  );
  const uniqueChangedPaths = [...new Set(changedPaths)].sort();
  invariant(
    uniqueChangedPaths.length === changedPaths.length,
    'working changed paths must not contain duplicates',
  );

  const activeTasks = backlog.tasks.filter(
    (task) =>
      typeof task.lease.owner === 'string' &&
      task.lease.owner.length > 0,
  );
  invariant(
    activeTasks.length <= 1,
    'release integration permits at most one leased task; found ' + activeTasks.length,
  );
  if (uniqueChangedPaths.length === 0) {
    return {
      activeTaskId: activeTasks[0]?.taskId ?? null,
      changedPathCount: 0,
    };
  }
  invariant(
    activeTasks.length === 1,
    'dirty release integration requires exactly one active task; found ' + activeTasks.length,
  );
  const [activeTask] = activeTasks;
  const allowlist = new Set(activeTask.changedPathAllowlist);
  const escapedPaths = uniqueChangedPaths.filter((changedPath) => !allowlist.has(changedPath));
  invariant(
    escapedPaths.length === 0,
    activeTask.taskId + ': changed paths escaped task-local allowlist: ' + escapedPaths.join(','),
  );
  return {
    activeTaskId: activeTask.taskId,
    changedPathCount: uniqueChangedPaths.length,
  };
}

export function verifyExternalInputStatus(status) {
  exactKeys(
    status,
    [
      'inputs',
      'namedFinalReviewers',
      'privacyBoundary',
      'publicLaunchEffect',
      'releaseId',
      'schemaVersion',
    ],
    'external input status',
  );
  invariant(status.schemaVersion === 1, 'external input schemaVersion must be 1');
  invariant(
    status.releaseId === 'HELP_MATH_2_PUBLIC_LAUNCH_V1',
    'external input status has an unexpected releaseId',
  );
  invariant(
    status.privacyBoundary ===
      'Values are stored only in the private release-input store; this file records presence and hash binding, never the values.',
    'external input privacy boundary drifted',
  );
  invariant(
    status.publicLaunchEffect === 'NO_GO_WHILE_ANY_REQUIRED_INPUT_IS_MISSING',
    'external-input launch effect must fail closed',
  );
  const expectedInputs = [
    'operatingLegalEntity',
    'jurisdictionStateAndCountry',
    'staffedAdultSupportEmail',
  ];
  exactKeys(status.inputs, expectedInputs, 'external input entries');
  for (const name of expectedInputs) {
    const entry = status.inputs[name];
    exactKeys(
      entry,
      name === 'staffedAdultSupportEmail'
        ? [
            'privateReceiptSha256',
            'received',
            'twoWayVerificationComplete',
            'verificationBasis',
          ]
        : ['privateReceiptSha256', 'received'],
      `${name} external input`,
    );
    invariant(entry && typeof entry.received === 'boolean', `${name}: missing received flag`);
    invariant(
      entry.privateReceiptSha256 === null || isSha256(entry.privateReceiptSha256),
      `${name}: invalid private receipt hash`,
    );
    invariant(
      entry.received === (entry.privateReceiptSha256 !== null),
      `${name}: received state and receipt hash must agree`,
    );
  }
  invariant(
    status.inputs.staffedAdultSupportEmail.verificationBasis ===
      'owner-attested-verified-and-staffed',
    'support email verification basis drifted',
  );
  invariant(
    status.inputs.staffedAdultSupportEmail.received ===
      (status.inputs.staffedAdultSupportEmail.twoWayVerificationComplete === true),
    'support email receipt and two-way verification must agree',
  );
  const namedReviewerEntries = Object.entries(status.namedFinalReviewers ?? {})
    .sort(([left], [right]) => left.localeCompare(right));
  invariant(
    JSON.stringify(namedReviewerEntries.map(([name]) => name)) ===
      JSON.stringify(REQUIRED_REVIEWER_ROLES),
    'the four exact final reviewer roles are required',
  );
  for (const [name, reviewer] of namedReviewerEntries) {
    exactKeys(
      reviewer,
      ['assigned', 'privateIdentityReceiptSha256'],
      `${name} reviewer assignment`,
    );
    invariant(
      reviewer && typeof reviewer.assigned === 'boolean',
      `${name}: reviewer assigned flag must be boolean`,
    );
    invariant(
      reviewer.privateIdentityReceiptSha256 === null ||
        isSha256(reviewer.privateIdentityReceiptSha256),
      `${name}: invalid reviewer identity receipt hash`,
    );
    invariant(
      reviewer.assigned === (reviewer.privateIdentityReceiptSha256 !== null),
      `${name}: reviewer assignment and identity receipt must agree`,
    );
  }
  return {
    receivedCount: expectedInputs.filter((name) => status.inputs[name].received).length,
    requiredCount: expectedInputs.length,
    namedReviewerCount: namedReviewerEntries.filter(
      ([, reviewer]) => reviewer.assigned,
    ).length,
    requiredNamedReviewerCount: namedReviewerEntries.length,
  };
}

export function verifyPromotionAuthorization(document) {
  exactKeys(
    document,
    [
      'approvalReceiptSha256',
      'disabledPublicFeatures',
      'hardGates',
      'promotion',
      'releaseId',
      'schemaVersion',
      'status',
    ],
    'promotion authorization',
  );
  invariant(document.schemaVersion === 1, 'promotion authorization schemaVersion must be 1');
  invariant(
    document.releaseId === 'HELP_MATH_2_PUBLIC_LAUNCH_V1',
    'promotion authorization releaseId mismatch',
  );
  invariant(
    document.status === 'NO_GO' || document.status === 'AUTHORIZED',
    'promotion authorization status must be NO_GO or AUTHORIZED',
  );

  exactKeys(document.hardGates, PROMOTION_HARD_GATE_NAMES, 'promotion hardGates');
  const falseHardGates = PROMOTION_HARD_GATE_NAMES.filter(
    (name) => document.hardGates[name] !== true,
  );
  invariant(
    PROMOTION_HARD_GATE_NAMES.every(
      (name) => typeof document.hardGates[name] === 'boolean',
    ),
    'every promotion hard gate must be boolean',
  );

  exactKeys(
    document.disabledPublicFeatures,
    DISABLED_PUBLIC_FEATURE_NAMES,
    'promotion disabledPublicFeatures',
  );
  for (const name of DISABLED_PUBLIC_FEATURE_NAMES) {
    invariant(
      document.disabledPublicFeatures[name] === false,
      `public feature must remain false for launch: ${name}`,
    );
  }

  exactKeys(
    document.approvalReceiptSha256,
    REQUIRED_REVIEWER_ROLES,
    'promotion approvalReceiptSha256',
  );
  for (const role of REQUIRED_REVIEWER_ROLES) {
    const receipt = document.approvalReceiptSha256[role];
    invariant(receipt === null || isSha256(receipt), `${role}: invalid approval receipt hash`);
  }

  exactKeys(document.promotion, PROMOTION_FIELDS, 'promotion binding');
  const promotion = document.promotion;
  invariant(
    typeof promotion.automaticPromotionAllowed === 'boolean',
    'automaticPromotionAllowed must be boolean',
  );
  invariant(
    JSON.stringify(promotion.productionDomains) ===
      JSON.stringify(['helpmath.ai', 'www.helpmath.ai']),
    'productionDomains must bind the exact launch aliases',
  );
  invariant(promotion.timeZone === 'Asia/Shanghai', 'promotion timeZone must be Asia/Shanghai');

  const nullableCommitFields = ['exactCommit', 'exactTree'];
  for (const field of nullableCommitFields) {
    invariant(
      promotion[field] === null || isCommit(promotion[field]),
      `${field} must be null or a 40-character Git identity`,
    );
  }
  const nullableHashFields = [
    'finalAuthorizationReceiptSha256',
    'launchManifestSha256',
    'rollbackReceiptSha256',
    'rollbackThresholdsReceiptSha256',
    'runtimeAssetClosureSha256',
    'stagedDeploymentReceiptSha256',
  ];
  for (const field of nullableHashFields) {
    invariant(
      promotion[field] === null || isSha256(promotion[field]),
      `${field} must be null or SHA-256`,
    );
  }
  for (const field of ['stagedDeploymentId', 'lastKnownGoodDeploymentId']) {
    invariant(
      promotion[field] === null || /^dpl_[A-Za-z0-9]+$/u.test(promotion[field]),
      `${field} must be null or a Vercel deployment ID`,
    );
  }
  for (const field of ['windowStartsAt', 'windowEndsAt']) {
    invariant(
      promotion[field] === null || Number.isFinite(Date.parse(promotion[field])),
      `${field} must be null or an ISO date-time`,
    );
  }
  if (promotion.windowStartsAt !== null && promotion.windowEndsAt !== null) {
    invariant(
      Date.parse(promotion.windowEndsAt) > Date.parse(promotion.windowStartsAt),
      'promotion window must end after it starts',
    );
  }

  const approvalCount = REQUIRED_REVIEWER_ROLES.filter(
    (role) => isSha256(document.approvalReceiptSha256[role]),
  ).length;
  const exactArtifactsComplete = [
    ...nullableCommitFields,
    ...nullableHashFields,
    'stagedDeploymentId',
    'lastKnownGoodDeploymentId',
    'windowStartsAt',
    'windowEndsAt',
  ].every((field) => promotion[field] !== null);

  if (document.status === 'NO_GO') {
    invariant(
      promotion.automaticPromotionAllowed === false,
      'NO_GO authorization cannot permit automatic promotion',
    );
  } else {
    invariant(promotion.automaticPromotionAllowed === true, 'AUTHORIZED must permit promotion');
    invariant(falseHardGates.length === 0, 'AUTHORIZED requires every hard gate');
    invariant(
      approvalCount === REQUIRED_REVIEWER_ROLES.length,
      'AUTHORIZED requires all four approval receipts',
    );
    invariant(exactArtifactsComplete, 'AUTHORIZED requires every exact artifact binding');
  }

  return Object.freeze({
    status: document.status,
    automaticPromotionAllowed: promotion.automaticPromotionAllowed,
    falseHardGates: Object.freeze(falseHardGates),
    approvalCount,
    requiredApprovalCount: REQUIRED_REVIEWER_ROLES.length,
    exactArtifactsComplete,
    exactCommit: promotion.exactCommit,
    exactTree: promotion.exactTree,
    stagedDeploymentId: promotion.stagedDeploymentId,
    finalAuthorizationReceiptSha256: promotion.finalAuthorizationReceiptSha256,
    requiredTaskArtifacts: Object.freeze([
      ...nullableHashFields.map((field) => promotion[field]).filter(isSha256),
      ...(promotion.stagedDeploymentId === null
        ? []
        : [`deployment:${promotion.stagedDeploymentId}`]),
      ...(promotion.lastKnownGoodDeploymentId === null
        ? []
        : [`last-known-good:${promotion.lastKnownGoodDeploymentId}`]),
    ]),
  });
}

export function verifyExternalAuthorizationAnchor(
  promotionAuthorization,
  suppliedSha256 = process.env.HELP_MATH_RELEASE_AUTHORIZATION_SHA256,
) {
  const supplied = typeof suppliedSha256 === 'string' ? suppliedSha256.trim() : '';
  if (supplied.length === 0) return Object.freeze({status: 'MISSING'});
  if (!isSha256(supplied)) return Object.freeze({status: 'INVALID'});
  if (supplied !== promotionAuthorization.finalAuthorizationReceiptSha256) {
    return Object.freeze({status: 'MISMATCH'});
  }
  return Object.freeze({status: 'MATCHED'});
}

export function deriveReleaseReadiness({
  backlog,
  externalInputs,
  promotionAuthorization,
  repository,
  externalAuthorizationAnchor,
}) {
  const blockingReasons = [];
  const missingInputs = externalInputs.requiredCount - externalInputs.receivedCount;
  const missingReviewers =
    externalInputs.requiredNamedReviewerCount - externalInputs.namedReviewerCount;
  if (missingInputs > 0) blockingReasons.push(`required-owner-inputs-missing:${missingInputs}`);
  if (missingReviewers > 0) blockingReasons.push(`named-final-reviewers-missing:${missingReviewers}`);

  const incompleteTasks = backlog.tasks
    .filter(
      (task) =>
        task.releaseBlocking &&
        (
          task.result !== 'PASS' ||
          LIFECYCLE_STATES.indexOf(task.status) <
            LIFECYCLE_STATES.indexOf(task.requiredTerminalState)
        ),
    )
    .map((task) => task.taskId)
    .sort();
  if (incompleteTasks.length > 0) {
    blockingReasons.push(`release-blocking-tasks-incomplete:${incompleteTasks.join(',')}`);
  }

  const stagedPromotionTasks = backlog.tasks.filter(
    (task) =>
      task.lane === 'production-promotion' &&
      task.result === 'PASS' &&
      LIFECYCLE_STATES.indexOf(task.status) >=
        LIFECYCLE_STATES.indexOf('STAGED_PRODUCTION_VERIFIED'),
  );
  if (stagedPromotionTasks.length !== 1) {
    blockingReasons.push(
      `exact-staged-production-task-count:${stagedPromotionTasks.length}`,
    );
  } else if (promotionAuthorization.exactArtifactsComplete) {
    const [stagedTask] = stagedPromotionTasks;
    const artifactHashes = new Set(stagedTask.output.artifactHashes);
    const taskMatchesAuthorization =
      stagedTask.output.commit === promotionAuthorization.exactCommit &&
      stagedTask.output.tree === promotionAuthorization.exactTree &&
      promotionAuthorization.requiredTaskArtifacts.every((artifact) => artifactHashes.has(artifact)) &&
      stagedTask.gateEffects.preview === true &&
      stagedTask.gateEffects.production === true;
    if (!taskMatchesAuthorization) blockingReasons.push('staged-task-artifact-mismatch');
  }

  if (promotionAuthorization.status !== 'AUTHORIZED') {
    blockingReasons.push(`promotion-authorization-status:${promotionAuthorization.status}`);
  }
  if (!promotionAuthorization.automaticPromotionAllowed) {
    blockingReasons.push('automatic-promotion-not-authorized');
  }
  if (promotionAuthorization.falseHardGates.length > 0) {
    blockingReasons.push(
      `promotion-hard-gates-open:${promotionAuthorization.falseHardGates.join(',')}`,
    );
  }
  if (promotionAuthorization.approvalCount !== promotionAuthorization.requiredApprovalCount) {
    blockingReasons.push(
      `promotion-approval-receipts-missing:${
        promotionAuthorization.requiredApprovalCount - promotionAuthorization.approvalCount
      }`,
    );
  }
  if (!promotionAuthorization.exactArtifactsComplete) {
    blockingReasons.push('exact-promotion-artifact-bindings-incomplete');
  } else if (
    repository?.head !== promotionAuthorization.exactCommit ||
    repository?.tree !== promotionAuthorization.exactTree
  ) {
    blockingReasons.push('exact-promotion-checkout-identity-mismatch');
  }
  if (externalAuthorizationAnchor?.status !== 'MATCHED') {
    blockingReasons.push(
      `external-final-authorization-anchor:${
        externalAuthorizationAnchor?.status ?? 'MISSING'
      }`,
    );
  }

  return Object.freeze({
    status: blockingReasons.length === 0 ? 'GO' : 'NO_GO',
    blockingReasons: Object.freeze(blockingReasons),
  });
}

export function verifyAnchorShape(anchors) {
  invariant(anchors.schemaVersion === 1, 'anchor schemaVersion must be 1');
  invariant(isCommit(anchors.originMain.commit), 'invalid origin/main commit');
  invariant(isCommit(anchors.originMain.tree), 'invalid origin/main tree');
  invariant(isCommit(anchors.pageOnlySpine.commit), 'invalid page-only commit');
  invariant(isCommit(anchors.pageOnlySpine.tree), 'invalid page-only tree');
  invariant(
    isSha256(anchors.pageOnlySpine.sortedChangedPathSetSha256),
    'invalid changed path-set hash',
  );
  invariant(
    anchors.releaseIntegration.baseCommit === anchors.pageOnlySpine.commit &&
      anchors.releaseIntegration.baseTree === anchors.pageOnlySpine.tree,
    'release integration must start at the exact page-only spine',
  );
  invariant(
    Array.isArray(anchors.releaseIntegration.allowedChangedPaths) &&
      anchors.releaseIntegration.allowedChangedPathCount ===
        anchors.releaseIntegration.allowedChangedPaths.length,
    'release integration changed-path allowlist is malformed',
  );
  invariant(
    JSON.stringify([...anchors.releaseIntegration.allowedChangedPaths].sort()) ===
      JSON.stringify(anchors.releaseIntegration.allowedChangedPaths),
    'release integration changed-path allowlist must be sorted',
  );
  invariant(
    anchors.rejectedMixedCommit.wholeCommitIntegrationAuthorized === false,
    'mixed commit must remain rejected',
  );
  exactKeys(
    anchors.boundExternalReceipts,
    BOUND_EXTERNAL_RECEIPT_NAMES,
    'boundExternalReceipts',
  );
  for (const name of BOUND_EXTERNAL_RECEIPT_NAMES) {
    invariant(
      isSha256(anchors.boundExternalReceipts[name]),
      `invalid bound external receipt: ${name}`,
    );
  }
  for (const gate of GATE_NAMES) {
    invariant(anchors.gateEffects[gate] === false, `anchor must not advance ${gate}`);
  }
  return true;
}

function verifyBoundReceiptReferences({anchors, backlog, externalInputs}) {
  const taskById = new Map(backlog.tasks.map((task) => [task.taskId, task]));
  const requireTaskArtifact = (taskId, receiptName) => {
    const task = taskById.get(taskId);
    invariant(task, `missing receipt-bound task: ${taskId}`);
    invariant(
      task.output.artifactHashes.includes(anchors.boundExternalReceipts[receiptName]),
      `${taskId} does not bind ${receiptName}`,
    );
  };
  requireTaskArtifact('C0-001-EXTERNAL-OWNER-INPUTS', 'ownerInputsSha256');
  requireTaskArtifact(
    'C0-002-PRIVATE-REPOSITORY-BOUNDARY',
    'c0002CorrectRepositoryReviewSha256',
  );
  requireTaskArtifact(
    'C0-002-PRIVATE-REPOSITORY-BOUNDARY',
    'c0002WrongTargetSupersessionSha256',
  );
  requireTaskArtifact(
    'C0-002-PRIVATE-REPOSITORY-BOUNDARY',
    'githubProductionEnvironmentBoundarySha256',
  );
  requireTaskArtifact(
    'C0-003-PAGE-ONLY-INTEGRATION-SPINE',
    'c0003PageOnlySpineReviewSha256',
  );
  requireTaskArtifact('C0-004-DEPLOY-CLOSURE', 'c0004DeployClosureReviewSha256');
  requireTaskArtifact(
    'C0-005-GITHUB-HOSTED-CI',
    'c0005AnimationRuntimeAudioPassiveLoopReviewSha256',
  );
  requireTaskArtifact(
    'C0-005-GITHUB-HOSTED-CI',
    'c0005IntegratedSuccessorIndependentReviewSha256',
  );
  requireTaskArtifact(
    'C0-005-GITHUB-HOSTED-CI',
    'c0005LocalExecutionV2Sha256',
  );
  requireTaskArtifact(
    'C0-005-GITHUB-HOSTED-CI',
    'c0005ResponsiveHostedFailureQuarantineSha256',
  );
  requireTaskArtifact(
    'C0-005-GITHUB-HOSTED-CI',
    'c0005SiteRuntimeFailClosedGateReviewSha256',
  );
  requireTaskArtifact(
    'C0-005-GITHUB-HOSTED-CI',
    'c0005StagedSecretSecurityPrecommitReviewSha256',
  );
  invariant(
    externalInputs.inputs.operatingLegalEntity.privateReceiptSha256 ===
      anchors.boundExternalReceipts.ownerInputsSha256 &&
      externalInputs.inputs.jurisdictionStateAndCountry.privateReceiptSha256 ===
        anchors.boundExternalReceipts.ownerInputsSha256 &&
      externalInputs.inputs.staffedAdultSupportEmail.privateReceiptSha256 ===
        anchors.boundExternalReceipts.ownerInputsSha256,
    'external owner inputs do not bind the frozen owner-input receipt',
  );
}

function verifyRepositoryBindings(anchors, backlog) {
  const head = git(['rev-parse', 'HEAD^{commit}']);
  const tree = git(['rev-parse', 'HEAD^{tree}']);
  git(['merge-base', '--is-ancestor', anchors.pageOnlySpine.commit, head]);

  const rejectedObject = gitResult([
    'cat-file',
    '-e',
    `${anchors.rejectedMixedCommit.commit}^{commit}`,
  ]);
  const rejectedAncestry = rejectedObject.status === 0
    ? gitResult([
      'merge-base',
      '--is-ancestor',
      anchors.rejectedMixedCommit.commit,
      head,
    ])
    : {status: null};
  verifyRejectedCommitProof({
    objectStatus: rejectedObject.status,
    ancestryStatus: rejectedAncestry.status,
  });

  const changedPaths = git([
    'diff',
    '--name-only',
    `${anchors.originMain.commit}..${anchors.pageOnlySpine.commit}`,
  ])
    .split('\n')
    .filter(Boolean)
    .sort();
  const changedPathSetSha256 = createHash('sha256')
    .update(`${changedPaths.join('\n')}\n`)
    .digest('hex');
  invariant(
    changedPathSetSha256 === anchors.pageOnlySpine.sortedChangedPathSetSha256,
    'page-only changed path set drifted',
  );

  const workingChangedPaths = [...new Set([
    ...git(['diff', '--name-only']).split('\n').filter(Boolean),
    ...git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean),
    ...git(['ls-files', '--others', '--exclude-standard'])
      .split('\n')
      .filter(Boolean),
  ])].sort();
  const taskOwnership = verifyActiveTaskChangedPathOwnership(backlog, workingChangedPaths);
  const releaseChangedPaths = [...new Set([
    ...git(['diff', '--name-only', `${anchors.releaseIntegration.baseCommit}..HEAD`])
      .split('\n')
      .filter(Boolean),
    ...workingChangedPaths,
  ])].sort();
  invariant(
    JSON.stringify(releaseChangedPaths) ===
      JSON.stringify(anchors.releaseIntegration.allowedChangedPaths),
    'release integration changed paths escaped the exact C0 allowlist',
  );

  const ledgerPath = path.join(projectRoot, 'catalog/page-only-migration-control-ledger.json');
  const generatorPath = path.join(projectRoot, 'scripts/build-page-only-migration-control-ledger.mjs');
  invariant(
    sha256(ledgerPath) === anchors.pageOnlyEvidence.controlLedgerSha256,
    'page-only control ledger hash drifted',
  );
  invariant(
    sha256(generatorPath) === anchors.pageOnlyEvidence.generatorSha256,
    'page-only ledger generator hash drifted',
  );

  return {
    head,
    tree,
    pageOnlyChangedPathCount: changedPaths.length,
    releaseIntegrationChangedPathCount: releaseChangedPaths.length,
    taskLocalChangedPathCount: taskOwnership.changedPathCount,
    taskLocalOwnerTaskId: taskOwnership.activeTaskId,
  };
}

function readJson(name) {
  return JSON.parse(readFileSync(path.join(controlRoot, name), 'utf8'));
}

function main() {
  const requireGo = process.argv.includes('--require-go');
  const anchors = readJson('branch-anchors.v1.json');
  const backlog = readJson('backlog.v1.json');
  const externalInputs = readJson('external-input-status.v1.json');
  const promotionAuthorizationDocument = readJson('promotion-authorization.v1.json');
  verifyAnchorShape(anchors);
  const backlogResult = verifyBacklog(backlog);
  const externalInputResult = verifyExternalInputStatus(externalInputs);
  const promotionAuthorization = verifyPromotionAuthorization(
    promotionAuthorizationDocument,
  );
  const repository = verifyRepositoryBindings(anchors, backlog);
  verifyBoundReceiptReferences({anchors, backlog, externalInputs});
  const externalAuthorizationAnchor = verifyExternalAuthorizationAnchor(
    promotionAuthorization,
  );
  const releaseReadiness = deriveReleaseReadiness({
    backlog,
    externalInputs: externalInputResult,
    promotionAuthorization,
    repository,
    externalAuthorizationAnchor,
  });
  process.stdout.write(
    `${JSON.stringify(
      {
        schemaVersion: 1,
        status: 'CONTROL_CONTRACT_PASS',
        releaseId: anchors.releaseId,
        ...backlogResult,
        externalInputs: externalInputResult,
        promotionAuthorization,
        externalAuthorizationAnchor,
        releaseReadiness,
        repository,
        gateEffects: anchors.gateEffects,
      },
      null,
      2,
    )}\n`,
  );
  if (requireGo && releaseReadiness.status !== 'GO') process.exitCode = 1;
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
