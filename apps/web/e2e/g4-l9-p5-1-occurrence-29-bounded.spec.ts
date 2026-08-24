import {
  expect,
  test,
  type Browser,
  type Locator,
  type Page,
  type Request,
} from '@playwright/test';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

const route = '/migration-status/g4-l9-product-bridge';
const animationId = 'course-g04-l09-ti-004';
const placementId = 'g04-l09-placement-029';
const storageKey = 'helpmath:g4-l9-p5-product-bridge:v1';
const privateBridgeReleaseId = 'private-g4-l9-p5-f08-occurrence-32-stress-v1';
const taskId =
  'HELP-MATH-G4-L9-P5-1-OCCURRENCE-29-VISUAL-REMEDIATION-20260824';
const remediationParentCommit =
  'f40b0a3befc1c8f6f263cb58173e3fbecccde4e9';
const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const evidenceRootInput = process.env.HELP_MATH_P51_V2_EVIDENCE_ROOT;
const expectedHeadInput = process.env.HELP_MATH_P51_EXPECTED_HEAD;
const preflightReceiptInput = process.env.HELP_MATH_P51_PREFLIGHT_RECEIPT;
const preflightReceiptSha256Input =
  process.env.HELP_MATH_P51_PREFLIGHT_RECEIPT_SHA256;
const evidenceRoot = evidenceRootInput
  ? path.resolve(evidenceRootInput)
  : undefined;
const receiptPath = evidenceRoot
  ? path.join(
      evidenceRoot,
      'reports/g4-l9-p5-1-occurrence-29-browser-qa-receipt-v2.json',
    )
  : undefined;
const execFileAsync = promisify(execFile);
const exactRemediationPaths = [
  'apps/web/app/globals.css',
  'apps/web/e2e/g4-l9-p5-1-occurrence-29-bounded.spec.ts',
  'packages/demos/src/g4-l9-p4-runtime.ts',
  'packages/demos/tests/course-g04-l09-p5-1-occurrence-29-bounded.test.ts',
] as const;
const nextEnvPath = 'apps/web/next-env.d.ts';
const nextEnvHeadIdentity = {
  bytes: 288,
  gitBlob: 'ce4e94a6b10f160ee021fe18939af160d2927dcf',
  sha256: '1862ac4bbbc5192d4bf562161df66ea547ed3e67173100656ab606ae9797db2b',
} as const;
const nextEnvDevelopmentIdentity = {
  bytes: 296,
  gitBlob: 'a419cbe4e3a5e8d4b481b851dbf4ac767de069e6',
  sha256: '0f70629890b72a0a82e91972cc032c04b658b26c265373cb711cf576bfbf8fcc',
} as const;
const runtimeIdentity = {
  rootPackageLockSha256:
    'bf018f562d7ab1fdebe8507f4f5a1fdfabf48ebea3c03224d0a060de410a6ec9',
  installedPackageLockSha256:
    '8935d1b3f6fcafd594ac8c50f3ddaffbc9bca9f9373fc11c70dd2fa529dca644',
  nextVersion: '16.3.1',
  nextPackageSha256:
    'dc243091ba95352bbc300be22c6561d24a19a1c0bd2c2cc85d2c5168767ea7b9',
  nextConfigSha256:
    '57a58090fc6acc6ed4f41c5a59900fb3e9da315c6ad3f6c22e67561afbad8d47',
  playwrightConfigSha256:
    '509c46b5d7feeaf1382a5b5728aa48ab71e642a0a40c056828756609449b50b3',
  nextCommonJsConfigSha256:
    '214ec6eb1ac9300b81efeb6c991a8d4a1bdf9877c4e972f04611298c9d0e89c2',
  nextBundlerSha256:
    'dd5771243a9e7732260aaeb1ac74dacca0382dc49cc4e6e959699bd820730be1',
  nextDevCliSha256:
    'e6202db1ebc93814d32215436bb7b6e8fef7a2747fcc32aa1800bf757089dd1b',
  nextEsmConfigSha256:
    '661cdc77ab87cff637afcb92cf88b8dccec0580b701a4cef298d6fb238f10d6d',
  nextCommonJsDeclarationWriterSha256:
    '3973ebf0093b08136059a790442951ba498421627a52bfcf06e1584360e034c9',
  nextEsmDeclarationWriterSha256:
    '6550acf277c12a10b79858fbbe9d075cea486a45d5d4a10aad9bf96a36a7575f',
  playwrightRunnerSha256:
    '42772378ebad5d2387726d02d377721112edbdde99d495c1259855ddb701b08e',
} as const;
const distRootMutatingEnvironmentNames = [
  'HELP_MATH_CURRENT_JS_CANDIDATE_QA',
  'HELP_MATH_CLERK_SYNTHETIC_BUILD',
  'HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC',
  'G4_L3_WHOLE_LESSON_PACKAGE',
  'G4_L3_WHOLE_LESSON_PACKAGE_V3_1',
  'G4_L3_WHOLE_LESSON_PACKAGE_V3_2',
  'G4_L3_WHOLE_LESSON_PACKAGE_V3_3',
  'G5_L4_WHOLE_LESSON_PACKAGE',
  'VERCEL_ENV',
] as const;
const bundlerOrServedRootOverrideEnvironmentNames = [
  'IS_WEBPACK_TEST',
  'TURBOPACK',
  'IS_TURBOPACK_TEST',
  'NEXT_RSPACK',
  'NEXT_PRIVATE_DEV_DIR',
] as const;
const authorityEffectsAllFalse = {
  phaseBControllerAccepted: false,
  productVisualAccepted: false,
  originalRuntimeAccepted: false,
  fidelityAccepted: false,
  audioListeningAccepted: false,
  audioLanguageAccepted: false,
  audioSyncAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  exactEquivalenceAdmission: false,
  occurrence20Authorized: false,
  familyF08Authorized: false,
  remainingG4L9OccurrencesAuthorized: false,
  bulkScaleOutAuthorized: false,
  p6Authorized: false,
  formalRegistryExpanded: false,
  strictComplete: false,
  releaseAuthorized: false,
  previewAuthorized: false,
  deploymentAuthorized: false,
  published: false,
  productionVerified: false,
} as const;

const glossaryHandlers = [
  ['Equation', 'equation', 'Equation'],
  ['Mathematical aentence', 'sentence', 'Sentence'],
  ['Show', 'show', 'Show'],
  ['Expression', 'expression', 'Expression'],
  ['Equal', 'equal', 'Equal'],
  ['Expression', 'expression', 'Expression'],
  ['Equation', 'equation', 'Equation'],
  ['Equal', 'equal', 'Equal'],
  ['Expression', 'expression', 'Expression'],
  ['Sentence', 'sentence', 'Sentence'],
  ['Equation', 'equation', 'Equation'],
  ['Show', 'show', 'Show'],
] as const;

type CaptureReceipt = {
  path: string;
  bytes: number;
  sha256: string;
  browserVersion: string;
  locale: 'en' | 'es';
  viewport: {width: number; height: number};
  layout: LayoutReceipt;
  network: NetworkReceipt;
  consoleErrors: number;
  pageErrors: number;
  failedRequests: number;
  forbiddenRequests: number;
  spanishTitleState: 'not-applicable' | 'english-source-fallback-disclosed';
};

type TestedSubjectReceipt = {
  commit: string;
  parentCommit: string;
  tree: string;
  worktreeRoot: string;
  primaryRepositoryRoot: string;
  worktreeClean: false;
  authoredRuntimeSourceMatchesCommit: true;
  runtimeGeneratedDriftKind: 'next16-development-next-env-only';
  runtimeGitState: {
    porcelainV1Z: string;
    stagedPathCount: 0;
    nonignoredUntrackedPathCount: 0;
    unexpectedTrackedPathCount: 0;
    unstagedTrackedPaths: [typeof nextEnvPath];
  };
  exactFrameworkGeneratedDrift: {
    path: typeof nextEnvPath;
    indexStage: 0;
    mode: '100644';
    head: typeof nextEnvHeadIdentity;
    worktree: typeof nextEnvDevelopmentIdentity;
    changedImports: [
      {
        from: './.next/types/routes.d.ts';
        to: './.next/dev/types/routes.d.ts';
      },
      {
        from: './.next/types/root-params.d.ts';
        to: './.next/dev/types/root-params.d.ts';
      },
    ];
    allOtherBytesMatchHead: true;
  };
  runtimeDependencyContext: {
    localNodeModules: string;
    localNodeModulesRealDirectory: true;
    localNodeModulesSymbolicLink: false;
    workspaceLinks: Array<{
      packageName: '@helpmath/web' | '@helpmath/demos';
      linkPath: string;
      symbolicLink: true;
      canonicalTarget: string;
    }>;
    rootPackageLockSha256: string;
    installedPackageLockSha256: string;
    currentJsCandidateProfileEnabled: true;
    distRootMutatingEnvironmentNamesUnset: string[];
    bundlerOrServedRootOverrideEnvironmentNamesUnset: string[];
    next: {
      version: string;
      packageSha256: string;
      bundlerSha256: string;
      devCliSha256: string;
      commonJsConfigSha256: string;
      esmConfigSha256: string;
      commonJsDeclarationWriterSha256: string;
      esmDeclarationWriterSha256: string;
    };
    project: {
      nextConfigSha256: string;
      playwrightConfigSha256: string;
      playwrightRunnerSha256: string;
    };
  };
  preflightReceipt: {
    canonicalPath: string;
    bytes: number;
    sha256: string;
    schemaVersion: 1;
    artifactKind: 'p51-v2-fresh-server-prelaunch-receipt';
    result: 'PASS';
    subjectWasCleanBeforeFreshServer: true;
    dependencyMaterializationVerified: true;
    standardFreshServerLauncherInputsVerified: true;
  };
  changedPathCount: 4;
  exactChangedPaths: string[];
  exactPathProjection: string[];
  files: Array<{
    path: string;
    mode: string;
    gitBlob: string;
    bytes: number;
    sha256: string;
  }>;
  e2eSpecSha256: string;
};

type PreflightReceiptDocument = {
  schemaVersion: 1;
  artifactKind: 'p51-v2-fresh-server-prelaunch-receipt';
  result: 'PASS';
  gateScope: 'runtime-dependency-materialization-and-fresh-server-inputs-only';
  authorityEffects: typeof authorityEffectsAllFalse;
  subject: {
    worktreeRoot: string;
    commit: string;
    parent: string;
    tree: string;
    gitStatusByteLength: 0;
    gitStatusSha256: string;
    exactChangedPathCount: 4;
    exactChangedPaths: string[];
  };
  dependencyMaterialization: {
    destinationInitiallyAbsent: true;
    copyMethod: 'macos-cp-clonefile-cR-P-p';
    sourceNodeModules: string;
    destinationNodeModules: string;
    sourceAndDestinationSameDevice: true;
    destinationTopLevelRealDirectory: true;
    destinationTopLevelSymlink: false;
    manifestEqual: true;
    sourceManifestSha256: string;
    destinationManifestSha256: string;
    regularFileHardlinkIntersectionCount: 0;
    symlinkCount: 35;
    symlinkStringsMatch: true;
    workspaceLinksResolveToSubject: true;
    currentNodeModulesRecordCount: 655;
    installedLockAllRecordCount: 531;
    installedNodeModulesRecordCount: 529;
    installedNonLinkNodeModulesRecordCount: 527;
    installedWorkspaceLinkCount: 2;
    missingOptionalNodeModulesRecordCount: 126;
    allMissingNodeModulesRecordsOptional: true;
    lockIdentityMismatchCount: 0;
    extraInstalledLockRecordCount: 0;
  };
  launcher: {
    playwrightConfigSha256: string;
    webServerCommand: string;
    host: string;
    port: number;
    reuseExistingServer: false;
    bundler: 'next-default-turbopack';
    webpackOverrideUnset: true;
    turbopackOverrideUnset: true;
    rspackOverrideUnset: true;
    distRootMutatingEnvironmentNamesUnset: string[];
  };
  freshness: {
    portInitiallyUnused: true;
    distDirRootInitiallyAbsent: true;
    distDirRoot: string;
    effectiveDevelopmentDistRoot: string;
    v2EvidenceRootInitiallyEmpty: true;
    v2EvidenceRoot: string;
  };
};

type EvidenceBoundaryReceipt = {
  canonicalEvidenceRoot: string;
  canonicalSubjectWorktree: string;
  canonicalPrimaryRepository: string;
  outsideSubjectWorktree: true;
  outsidePrimaryRepository: true;
  initiallyEmpty: true;
  outputParentsContainedByEvidenceRoot: true;
  appendOnlyLeafWrites: true;
};

type RectReceipt = {
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

type LayoutReceipt = {
  initialWindowScroll: {x: number; y: number};
  sourceSafeRegion: RectReceipt;
  interactionPanel: RectReceipt;
  requiredControlSurface: RectReceipt;
  reducedMotionNotice: RectReceipt;
  sourceInteractionOverlapArea: number;
  sourceReducedMotionOverlapArea: number;
  normalFlowOrder: boolean;
  documentHorizontalOverflowPx: number;
  requiredControlSurfaceOverflow: {
    clientHeight: number;
    scrollHeight: number;
    clientWidth: number;
    scrollWidth: number;
    overflowX: string;
    overflowY: string;
  };
  clipHosts: Array<{
    className: string;
    clientHeight: number;
    scrollHeight: number;
    clientWidth: number;
    scrollWidth: number;
    overflowX: string;
    overflowY: string;
  }>;
  requiredControls: Array<{
    label: string;
    initialRect: RectReceipt;
    display: string;
    visibility: string;
    opacity: number;
    position: string;
    clippingAncestors: Array<{
      className: string;
      overflowX: string;
      overflowY: string;
    }>;
    ancestorVisibleRatio: number;
    initialWindowScroll: {x: number; y: number};
    afterScrollWindowScroll: {x: number; y: number};
    nestedScrollableAncestorCount: number;
    nestedAncestorScrollOffsetsAfterScroll: Array<{
      className: string;
      scrollLeft: number;
      scrollTop: number;
    }>;
    viewportVisibleRatioAfterScroll: number;
    centerPointAfterScroll: {x: number; y: number};
    centerHitTarget: boolean;
  }>;
};

type HttpRequestClassification =
  | 'allowed'
  | 'forbidden-origin-or-legacy'
  | 'unexpected-local-path-or-method';

type HttpRequestLedgerEntry = {
  sequence: number;
  method: string;
  resourceType: string;
  url: string;
  classification: HttpRequestClassification;
  responseStatus: number | null;
  terminalState: 'pending' | 'finished' | 'failed';
  failure: string | null;
};

type NetworkReceipt = {
  normalizedAllowedOrigin: string;
  navigationStatus: number;
  totalHttpRequests: number;
  allowedHttpRequests: number;
  forbiddenHttpRequests: number;
  unexpectedHttpRequests: number;
  finishedHttpRequests: number;
  failedHttpRequests: number;
  unfinishedHttpRequests: number;
  httpErrorResponses: number;
  requests: HttpRequestLedgerEntry[];
  allowed: string[];
  forbidden: string[];
  unexpected: string[];
  failed: string[];
  httpErrors: string[];
};

const digest = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');

const immutableV1Evidence = [
  {
    path: 'reports/g4-l9-p5-1-occurrence-29-browser-qa-receipt-v1.json',
    sha256: '1f69d621eb39b59d2956117a772f020010ec3cb6cafd7ca7d921ddbc8007a920',
  },
  {
    path: 'reports/browser-qa/g4-l9-p5-1/desktop-en-1440x1000/029-course-g04-l09-ti-004.png',
    sha256: '63a767290dcfd7762404280037e9a70042fc9458b79331524f16f18a4b84946a',
  },
  {
    path: 'reports/browser-qa/g4-l9-p5-1/mobile-es-390x844/029-course-g04-l09-ti-004.png',
    sha256: '4d03814e16211ceb9b0cb72dbd649f4446705979421821932db7033444c2702c',
  },
] as const;

async function verifyImmutableV1Evidence() {
  for (const artifact of immutableV1Evidence) {
    expect(digest(await readFile(path.join(repositoryRoot, artifact.path))))
      .toBe(artifact.sha256);
  }
}

async function runGit(args: string[]) {
  return (await runGitExact(args)).trim();
}

async function runGitExact(args: string[]) {
  const {stdout} = await execFileAsync(
    'git',
    ['-C', repositoryRoot, ...args],
    {encoding: 'utf8', maxBuffer: 10 * 1024 * 1024},
  );
  return String(stdout);
}

async function assertSha256(filePath: string, expectedSha256: string) {
  const bytes = await readFile(filePath);
  expect(digest(bytes), `${filePath} SHA-256`).toBe(expectedSha256);
  return bytes;
}

async function captureRuntimeDependencyContext(): Promise<
  TestedSubjectReceipt['runtimeDependencyContext']
> {
  for (const environmentName of distRootMutatingEnvironmentNames) {
    expect(
      process.env[environmentName] ?? '',
      `${environmentName} must not change the standard .next development root`,
    ).toBe('');
  }
  for (const environmentName of bundlerOrServedRootOverrideEnvironmentNames) {
    expect(
      process.env[environmentName] ?? '',
      `${environmentName} must not override the standard served root or bundler`,
    ).toBe('');
  }
  expect(
    process.env.CURRENT_JS_CANDIDATE_PROFILE_ENABLED,
    'private Current-JS assets require the development-only candidate profile',
  ).toBe('true');

  const localNodeModules = path.join(repositoryRoot, 'node_modules');
  const nodeModulesInfo = await lstat(localNodeModules);
  expect(nodeModulesInfo.isDirectory(), 'local node_modules is a directory')
    .toBe(true);
  expect(
    nodeModulesInfo.isSymbolicLink(),
    'local node_modules must not be a shared-checkout symlink',
  ).toBe(false);
  expect(await realpath(localNodeModules)).toBe(localNodeModules);

  const workspaceSpecifications = [
    {
      packageName: '@helpmath/web' as const,
      linkPath: path.join(localNodeModules, '@helpmath/web'),
      expectedTarget: path.join(repositoryRoot, 'apps/web'),
    },
    {
      packageName: '@helpmath/demos' as const,
      linkPath: path.join(localNodeModules, '@helpmath/demos'),
      expectedTarget: path.join(repositoryRoot, 'packages/demos'),
    },
  ];
  const workspaceLinks = [];
  for (const workspace of workspaceSpecifications) {
    const linkInfo = await lstat(workspace.linkPath);
    expect(
      linkInfo.isSymbolicLink(),
      `${workspace.packageName} remains a workspace symbolic link`,
    ).toBe(true);
    const canonicalTarget = await realpath(workspace.linkPath);
    expect(
      canonicalTarget,
      `${workspace.packageName} resolves inside the browser-tested subject`,
    ).toBe(await realpath(workspace.expectedTarget));
    workspaceLinks.push({
      packageName: workspace.packageName,
      linkPath: workspace.linkPath,
      symbolicLink: true as const,
      canonicalTarget,
    });
  }

  const rootLock = await assertSha256(
    path.join(repositoryRoot, 'package-lock.json'),
    runtimeIdentity.rootPackageLockSha256,
  );
  const installedLock = await assertSha256(
    path.join(localNodeModules, '.package-lock.json'),
    runtimeIdentity.installedPackageLockSha256,
  );
  expect(JSON.parse(rootLock.toString('utf8')).packages).toBeTruthy();
  expect(JSON.parse(installedLock.toString('utf8')).packages).toBeTruthy();

  const nextPackagePath = path.join(localNodeModules, 'next/package.json');
  const nextPackage = await assertSha256(
    nextPackagePath,
    runtimeIdentity.nextPackageSha256,
  );
  expect(JSON.parse(nextPackage.toString('utf8')).version).toBe(
    runtimeIdentity.nextVersion,
  );
  await assertSha256(
    path.join(repositoryRoot, 'apps/web/next.config.ts'),
    runtimeIdentity.nextConfigSha256,
  );
  await assertSha256(
    path.join(repositoryRoot, 'apps/web/playwright.config.ts'),
    runtimeIdentity.playwrightConfigSha256,
  );
  await assertSha256(
    path.join(localNodeModules, 'next/dist/lib/bundler.js'),
    runtimeIdentity.nextBundlerSha256,
  );
  await assertSha256(
    path.join(localNodeModules, 'next/dist/cli/next-dev.js'),
    runtimeIdentity.nextDevCliSha256,
  );
  await assertSha256(
    path.join(localNodeModules, 'next/dist/server/config.js'),
    runtimeIdentity.nextCommonJsConfigSha256,
  );
  await assertSha256(
    path.join(localNodeModules, 'next/dist/esm/server/config.js'),
    runtimeIdentity.nextEsmConfigSha256,
  );
  await assertSha256(
    path.join(
      localNodeModules,
      'next/dist/lib/typescript/writeAppTypeDeclarations.js',
    ),
    runtimeIdentity.nextCommonJsDeclarationWriterSha256,
  );
  await assertSha256(
    path.join(
      localNodeModules,
      'next/dist/esm/lib/typescript/writeAppTypeDeclarations.js',
    ),
    runtimeIdentity.nextEsmDeclarationWriterSha256,
  );
  await assertSha256(
    path.join(localNodeModules, 'playwright/lib/runner/index.js'),
    runtimeIdentity.playwrightRunnerSha256,
  );

  return {
    localNodeModules,
    localNodeModulesRealDirectory: true,
    localNodeModulesSymbolicLink: false,
    workspaceLinks,
    rootPackageLockSha256: runtimeIdentity.rootPackageLockSha256,
    installedPackageLockSha256: runtimeIdentity.installedPackageLockSha256,
    currentJsCandidateProfileEnabled: true,
    distRootMutatingEnvironmentNamesUnset: [
      ...distRootMutatingEnvironmentNames,
    ],
    bundlerOrServedRootOverrideEnvironmentNamesUnset: [
      ...bundlerOrServedRootOverrideEnvironmentNames,
    ],
    next: {
      version: runtimeIdentity.nextVersion,
      packageSha256: runtimeIdentity.nextPackageSha256,
      bundlerSha256: runtimeIdentity.nextBundlerSha256,
      devCliSha256: runtimeIdentity.nextDevCliSha256,
      commonJsConfigSha256: runtimeIdentity.nextCommonJsConfigSha256,
      esmConfigSha256: runtimeIdentity.nextEsmConfigSha256,
      commonJsDeclarationWriterSha256:
        runtimeIdentity.nextCommonJsDeclarationWriterSha256,
      esmDeclarationWriterSha256:
        runtimeIdentity.nextEsmDeclarationWriterSha256,
    },
    project: {
      nextConfigSha256: runtimeIdentity.nextConfigSha256,
      playwrightConfigSha256: runtimeIdentity.playwrightConfigSha256,
      playwrightRunnerSha256: runtimeIdentity.playwrightRunnerSha256,
    },
  };
}

async function captureExactFrameworkGeneratedDrift(): Promise<{
  runtimeGitState: TestedSubjectReceipt['runtimeGitState'];
  exactFrameworkGeneratedDrift:
    TestedSubjectReceipt['exactFrameworkGeneratedDrift'];
}> {
  const expectedPorcelain = ` M ${nextEnvPath}\0`;
  const porcelainV1Z = await runGitExact([
    'status',
    '--porcelain=v1',
    '-z',
    '--untracked-files=all',
  ]);
  expect(
    porcelainV1Z,
    'runtime Git status contains only deterministic Next development drift',
  ).toBe(expectedPorcelain);

  const stagedPathsZ = await runGitExact([
    'diff',
    '--cached',
    '--name-only',
    '-z',
  ]);
  expect(stagedPathsZ, 'runtime has no staged paths').toBe('');
  const nonignoredUntrackedPathsZ = await runGitExact([
    'ls-files',
    '--others',
    '--exclude-standard',
    '-z',
  ]);
  expect(
    nonignoredUntrackedPathsZ,
    'runtime has no nonignored untracked paths',
  ).toBe('');
  const unstagedTrackedPathsZ = await runGitExact([
    'diff',
    '--name-only',
    '-z',
  ]);
  expect(
    unstagedTrackedPathsZ,
    'runtime unstaged path set is exactly the Next declaration file',
  ).toBe(`${nextEnvPath}\0`);

  const indexEntry = (await runGitExact([
    'ls-files',
    '--stage',
    '--',
    nextEnvPath,
  ])).trim();
  const indexMatch = /^(\d{6}) ([0-9a-f]{40}) (\d)\t(.+)$/u.exec(indexEntry);
  expect(indexMatch, 'next-env index identity').toBeTruthy();
  expect(indexMatch![1], 'next-env index mode').toBe('100644');
  expect(indexMatch![2], 'next-env index blob').toBe(
    nextEnvHeadIdentity.gitBlob,
  );
  expect(indexMatch![3], 'next-env index stage').toBe('0');
  expect(indexMatch![4], 'next-env index path').toBe(nextEnvPath);

  const headText = await runGitExact([
    'cat-file',
    'blob',
    nextEnvHeadIdentity.gitBlob,
  ]);
  const headBytes = Buffer.from(headText, 'utf8');
  expect(headBytes).toHaveLength(nextEnvHeadIdentity.bytes);
  expect(digest(headBytes), 'next-env HEAD SHA-256').toBe(
    nextEnvHeadIdentity.sha256,
  );
  const developmentText = headText.replaceAll(
    './.next/types/',
    './.next/dev/types/',
  );
  expect(
    headText.match(/\.\/\.next\/types\//gu),
    'HEAD next-env has exactly two production type imports',
  ).toHaveLength(2);
  expect(
    developmentText.match(/\.\/\.next\/dev\/types\//gu),
    'expected development next-env has exactly two dev type imports',
  ).toHaveLength(2);
  const expectedDevelopmentBytes = Buffer.from(developmentText, 'utf8');
  expect(expectedDevelopmentBytes).toHaveLength(
    nextEnvDevelopmentIdentity.bytes,
  );
  expect(digest(expectedDevelopmentBytes)).toBe(
    nextEnvDevelopmentIdentity.sha256,
  );
  const worktreeBytes = await readFile(path.join(repositoryRoot, nextEnvPath));
  expect(worktreeBytes, 'Next development next-env bytes').toEqual(
    expectedDevelopmentBytes,
  );
  expect(digest(worktreeBytes), 'Next development next-env SHA-256').toBe(
    nextEnvDevelopmentIdentity.sha256,
  );
  expect(
    await runGit(['hash-object', '--', nextEnvPath]),
    'Next development next-env Git blob',
  ).toBe(nextEnvDevelopmentIdentity.gitBlob);

  return {
    runtimeGitState: {
      porcelainV1Z,
      stagedPathCount: 0,
      nonignoredUntrackedPathCount: 0,
      unexpectedTrackedPathCount: 0,
      unstagedTrackedPaths: [nextEnvPath],
    },
    exactFrameworkGeneratedDrift: {
      path: nextEnvPath,
      indexStage: 0,
      mode: '100644',
      head: nextEnvHeadIdentity,
      worktree: nextEnvDevelopmentIdentity,
      changedImports: [
        {
          from: './.next/types/routes.d.ts',
          to: './.next/dev/types/routes.d.ts',
        },
        {
          from: './.next/types/root-params.d.ts',
          to: './.next/dev/types/root-params.d.ts',
        },
      ],
      allOtherBytesMatchHead: true,
    },
  };
}

function isPathWithin(parent: string, candidate: string) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function verifyPreflightReceipt({
  canonicalWorktreeRoot,
  primaryRepositoryRoot,
  commit,
  parentCommit,
  tree,
  runtimeDependencyContext,
}: {
  canonicalWorktreeRoot: string;
  primaryRepositoryRoot: string;
  commit: string;
  parentCommit: string;
  tree: string;
  runtimeDependencyContext: TestedSubjectReceipt['runtimeDependencyContext'];
}): Promise<TestedSubjectReceipt['preflightReceipt']> {
  if (!preflightReceiptInput || !preflightReceiptSha256Input) {
    throw new Error(
      'HELP_MATH_P51_PREFLIGHT_RECEIPT and '
      + 'HELP_MATH_P51_PREFLIGHT_RECEIPT_SHA256 are required.',
    );
  }
  expect(
    path.isAbsolute(preflightReceiptInput),
    'preflight receipt path is absolute',
  ).toBe(true);
  expect(
    preflightReceiptSha256Input,
    'preflight receipt controller hash is lowercase SHA-256',
  ).toMatch(/^[0-9a-f]{64}$/u);
  const canonicalPath = await realpath(preflightReceiptInput);
  expect(
    isPathWithin(canonicalWorktreeRoot, canonicalPath),
    'preflight receipt is outside the subject worktree',
  ).toBe(false);
  expect(
    isPathWithin(primaryRepositoryRoot, canonicalPath),
    'preflight receipt is outside the primary repository',
  ).toBe(false);
  if (!evidenceRoot) {
    throw new Error('HELP_MATH_P51_V2_EVIDENCE_ROOT is required.');
  }
  const canonicalEvidenceRoot = await realpath(evidenceRoot);
  expect(
    isPathWithin(canonicalEvidenceRoot, canonicalPath),
    'preflight receipt is separate from the initially-empty browser root',
  ).toBe(false);

  const receiptBytes = await readFile(canonicalPath);
  expect(digest(receiptBytes), 'preflight receipt SHA-256').toBe(
    preflightReceiptSha256Input,
  );
  const document = JSON.parse(
    receiptBytes.toString('utf8'),
  ) as PreflightReceiptDocument;
  expect(document.schemaVersion).toBe(1);
  expect(document.artifactKind).toBe(
    'p51-v2-fresh-server-prelaunch-receipt',
  );
  expect(document.result).toBe('PASS');
  expect(document.gateScope).toBe(
    'runtime-dependency-materialization-and-fresh-server-inputs-only',
  );
  expect(document.authorityEffects).toEqual(authorityEffectsAllFalse);
  expect(document.subject).toEqual({
    worktreeRoot: canonicalWorktreeRoot,
    commit,
    parent: parentCommit,
    tree,
    gitStatusByteLength: 0,
    gitStatusSha256:
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    exactChangedPathCount: exactRemediationPaths.length,
    exactChangedPaths: [...exactRemediationPaths],
  });

  const materialization = document.dependencyMaterialization;
  expect(materialization.destinationInitiallyAbsent).toBe(true);
  expect(materialization.copyMethod).toBe('macos-cp-clonefile-cR-P-p');
  expect(await realpath(materialization.sourceNodeModules)).toBe(
    path.join(primaryRepositoryRoot, 'node_modules'),
  );
  expect(await realpath(materialization.destinationNodeModules)).toBe(
    runtimeDependencyContext.localNodeModules,
  );
  expect(materialization.sourceAndDestinationSameDevice).toBe(true);
  expect(materialization.destinationTopLevelRealDirectory).toBe(true);
  expect(materialization.destinationTopLevelSymlink).toBe(false);
  expect(materialization.manifestEqual).toBe(true);
  expect(materialization.sourceManifestSha256).toMatch(/^[0-9a-f]{64}$/u);
  expect(materialization.destinationManifestSha256).toBe(
    materialization.sourceManifestSha256,
  );
  expect(materialization.regularFileHardlinkIntersectionCount).toBe(0);
  expect(materialization.symlinkCount).toBe(35);
  expect(materialization.symlinkStringsMatch).toBe(true);
  expect(materialization.workspaceLinksResolveToSubject).toBe(true);
  expect(materialization.currentNodeModulesRecordCount).toBe(655);
  expect(materialization.installedLockAllRecordCount).toBe(531);
  expect(materialization.installedNodeModulesRecordCount).toBe(529);
  expect(materialization.installedNonLinkNodeModulesRecordCount).toBe(527);
  expect(materialization.installedWorkspaceLinkCount).toBe(2);
  expect(materialization.missingOptionalNodeModulesRecordCount).toBe(126);
  expect(materialization.allMissingNodeModulesRecordsOptional).toBe(true);
  expect(materialization.lockIdentityMismatchCount).toBe(0);
  expect(materialization.extraInstalledLockRecordCount).toBe(0);

  const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
  const port = Number(process.env.PLAYWRIGHT_PORT ?? 3211);
  expect(document.launcher).toEqual({
    playwrightConfigSha256: runtimeIdentity.playwrightConfigSha256,
    webServerCommand: `npm run dev -- --hostname ${host} --port ${port}`,
    host,
    port,
    reuseExistingServer: false,
    bundler: 'next-default-turbopack',
    webpackOverrideUnset: true,
    turbopackOverrideUnset: true,
    rspackOverrideUnset: true,
    distRootMutatingEnvironmentNamesUnset: [
      ...distRootMutatingEnvironmentNames,
    ],
  });
  expect(document.freshness).toEqual({
    portInitiallyUnused: true,
    distDirRootInitiallyAbsent: true,
    distDirRoot: path.join(repositoryRoot, 'apps/web/.next'),
    effectiveDevelopmentDistRoot: path.join(
      repositoryRoot,
      'apps/web/.next/dev',
    ),
    v2EvidenceRootInitiallyEmpty: true,
    v2EvidenceRoot: canonicalEvidenceRoot,
  });

  return {
    canonicalPath,
    bytes: receiptBytes.length,
    sha256: preflightReceiptSha256Input,
    schemaVersion: 1,
    artifactKind: 'p51-v2-fresh-server-prelaunch-receipt',
    result: 'PASS',
    subjectWasCleanBeforeFreshServer: true,
    dependencyMaterializationVerified: true,
    standardFreshServerLauncherInputsVerified: true,
  };
}

async function captureTestedSubject(): Promise<TestedSubjectReceipt> {
  if (!expectedHeadInput) {
    throw new Error('HELP_MATH_P51_EXPECTED_HEAD is required.');
  }
  const canonicalWorktreeRoot = await realpath(repositoryRoot);
  const resolvedGitRoot = await realpath(await runGit([
    'rev-parse',
    '--show-toplevel',
  ]));
  expect(resolvedGitRoot, 'server worktree Git root')
    .toBe(canonicalWorktreeRoot);
  const gitCommonDirOutput = await runGit(['rev-parse', '--git-common-dir']);
  const canonicalGitCommonDir = await realpath(path.isAbsolute(gitCommonDirOutput)
    ? gitCommonDirOutput
    : path.resolve(repositoryRoot, gitCommonDirOutput));
  const primaryRepositoryRoot = await realpath(
    path.dirname(canonicalGitCommonDir),
  );

  const commit = await runGit(['rev-parse', 'HEAD^{commit}']);
  expect(commit, 'actual HEAD matches the controller-provided expected commit')
    .toBe(expectedHeadInput);
  const parentProjection = (await runGit([
    'rev-list',
    '--parents',
    '-n',
    '1',
    'HEAD',
  ])).split(/\s+/u);
  expect(parentProjection, 'remediation commit has exactly one parent')
    .toHaveLength(2);
  const parentCommit = parentProjection[1]!;
  expect(parentCommit, 'remediation commit parent')
    .toBe(remediationParentCommit);
  const tree = await runGit(['rev-parse', 'HEAD^{tree}']);
  const {
    runtimeGitState,
    exactFrameworkGeneratedDrift,
  } = await captureExactFrameworkGeneratedDrift();
  const runtimeDependencyContext = await captureRuntimeDependencyContext();

  const exactPathProjection = (await runGit([
    'diff-tree',
    '--no-commit-id',
    '--name-status',
    '-r',
    'HEAD',
  ])).split('\n').filter(Boolean);
  const exactChangedPaths = exactPathProjection.map((entry) => {
    const fields = entry.split('\t');
    expect(fields, `single-path diff projection ${entry}`).toHaveLength(2);
    expect(fields[0], `${fields[1]} change kind`).toBe('M');
    return fields[1]!;
  });
  expect([...exactChangedPaths].sort(), 'exact remediation path projection')
    .toEqual([...exactRemediationPaths].sort());

  const files = [];
  for (const relativePath of exactRemediationPaths) {
    const lsTree = await runGit(['ls-tree', 'HEAD', '--', relativePath]);
    const match = /^(\d{6}) blob ([0-9a-f]{40})\t(.+)$/u.exec(lsTree);
    expect(match, `${relativePath} committed blob identity`).toBeTruthy();
    expect(match![3], `${relativePath} committed path`).toBe(relativePath);
    const bytes = await readFile(path.join(repositoryRoot, relativePath));
    const worktreeBlob = await runGit(['hash-object', '--', relativePath]);
    expect(worktreeBlob, `${relativePath} worktree blob`).toBe(match![2]);
    expect(Number(await runGit(['cat-file', '-s', match![2]!]))).toBe(
      bytes.length,
    );
    files.push({
      path: relativePath,
      mode: match![1]!,
      gitBlob: match![2]!,
      bytes: bytes.length,
      sha256: digest(bytes),
    });
  }
  const preflightReceipt = await verifyPreflightReceipt({
    canonicalWorktreeRoot,
    primaryRepositoryRoot,
    commit,
    parentCommit,
    tree,
    runtimeDependencyContext,
  });

  return {
    commit,
    parentCommit,
    tree,
    worktreeRoot: canonicalWorktreeRoot,
    primaryRepositoryRoot,
    worktreeClean: false,
    authoredRuntimeSourceMatchesCommit: true,
    runtimeGeneratedDriftKind: 'next16-development-next-env-only',
    runtimeGitState,
    exactFrameworkGeneratedDrift,
    runtimeDependencyContext,
    preflightReceipt,
    changedPathCount: exactRemediationPaths.length,
    exactChangedPaths,
    exactPathProjection,
    files,
    e2eSpecSha256: files.find(
      (file) => file.path ===
        'apps/web/e2e/g4-l9-p5-1-occurrence-29-bounded.spec.ts',
    )!.sha256,
  };
}

async function establishEvidenceBoundary(
  subject: TestedSubjectReceipt,
): Promise<EvidenceBoundaryReceipt> {
  if (!evidenceRoot || !evidenceRootInput) {
    throw new Error('HELP_MATH_P51_V2_EVIDENCE_ROOT is required.');
  }
  expect(path.isAbsolute(evidenceRootInput), 'evidence root is absolute')
    .toBe(true);
  const canonicalEvidenceRoot = await realpath(evidenceRoot);
  expect(
    isPathWithin(subject.worktreeRoot, canonicalEvidenceRoot),
    'evidence root is outside the subject worktree',
  ).toBe(false);
  expect(
    isPathWithin(subject.primaryRepositoryRoot, canonicalEvidenceRoot),
    'evidence root is outside the primary repository',
  ).toBe(false);
  expect(await readdir(canonicalEvidenceRoot), 'new evidence root starts empty')
    .toEqual([]);
  return {
    canonicalEvidenceRoot,
    canonicalSubjectWorktree: subject.worktreeRoot,
    canonicalPrimaryRepository: subject.primaryRepositoryRoot,
    outsideSubjectWorktree: true,
    outsidePrimaryRepository: true,
    initiallyEmpty: true,
    outputParentsContainedByEvidenceRoot: true,
    appendOnlyLeafWrites: true,
  };
}

async function prepareEvidenceOutputParent(
  output: string,
  boundary: EvidenceBoundaryReceipt,
) {
  await mkdir(path.dirname(output), {recursive: true});
  const canonicalParent = await realpath(path.dirname(output));
  expect(
    isPathWithin(boundary.canonicalEvidenceRoot, canonicalParent),
    `${output} parent remains inside the canonical evidence root`,
  ).toBe(true);
  expect(
    isPathWithin(boundary.canonicalSubjectWorktree, canonicalParent),
    `${output} parent remains outside the subject worktree`,
  ).toBe(false);
  expect(
    isPathWithin(boundary.canonicalPrimaryRepository, canonicalParent),
    `${output} parent remains outside the primary repository`,
  ).toBe(false);
}

type RequiredControlReceipt = LayoutReceipt['requiredControls'][number];
type RequiredControlBaseline = Omit<
  RequiredControlReceipt,
  | 'afterScrollWindowScroll'
  | 'nestedScrollableAncestorCount'
  | 'nestedAncestorScrollOffsetsAfterScroll'
  | 'viewportVisibleRatioAfterScroll'
  | 'centerPointAfterScroll'
  | 'centerHitTarget'
>;

async function captureRequiredControlBaseline(
  control: Locator,
  label: string,
): Promise<RequiredControlBaseline> {
  const beforeScroll = await control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    let left = rect.left;
    let right = rect.right;
    let top = rect.top;
    let bottom = rect.bottom;
    const clippingAncestors: Array<{
      className: string;
      overflowX: string;
      overflowY: string;
    }> = [];
    for (
      let ancestor = element.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const style = getComputedStyle(ancestor);
      const ancestorRect = ancestor.getBoundingClientRect();
      if (/hidden|clip|auto|scroll/u.test(`${style.overflowX} ${style.overflowY}`)) {
        clippingAncestors.push({
          className: ancestor.getAttribute('class') ?? '',
          overflowX: style.overflowX,
          overflowY: style.overflowY,
        });
      }
      if (/hidden|clip|auto|scroll/u.test(style.overflowX)) {
        left = Math.max(left, ancestorRect.left);
        right = Math.min(right, ancestorRect.right);
      }
      if (/hidden|clip|auto|scroll/u.test(style.overflowY)) {
        top = Math.max(top, ancestorRect.top);
        bottom = Math.min(bottom, ancestorRect.bottom);
      }
    }
    const visibleArea = Math.max(0, right - left) * Math.max(0, bottom - top);
    const style = getComputedStyle(element);
    return {
      initialWindowScroll: {x: window.scrollX, y: window.scrollY},
      initialRect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      },
      display: style.display,
      visibility: style.visibility,
      opacity: Number(style.opacity),
      position: style.position,
      clippingAncestors,
      ancestorVisibleRatio: visibleArea / (rect.width * rect.height),
    };
  });
  expect(beforeScroll.initialRect.width, `${label} hit-target width`)
    .toBeGreaterThanOrEqual(44);
  expect(beforeScroll.initialRect.height, `${label} hit-target height`)
    .toBeGreaterThanOrEqual(44);
  expect(beforeScroll.display, `${label} display`).not.toBe('none');
  expect(beforeScroll.visibility, `${label} visibility`).toBe('visible');
  expect(beforeScroll.opacity, `${label} opacity`).toBeGreaterThan(0);
  expect(beforeScroll.ancestorVisibleRatio, `${label} is not clipped by an ancestor`)
    .toBeGreaterThanOrEqual(0.999);
  expect(beforeScroll.initialWindowScroll, `${label} initial window scroll`)
    .toEqual({x: 0, y: 0});

  return {
    label,
    initialRect: beforeScroll.initialRect,
    display: beforeScroll.display,
    visibility: beforeScroll.visibility,
    opacity: beforeScroll.opacity,
    position: beforeScroll.position,
    clippingAncestors: beforeScroll.clippingAncestors,
    ancestorVisibleRatio: beforeScroll.ancestorVisibleRatio,
    initialWindowScroll: beforeScroll.initialWindowScroll,
  };
}

async function captureRequiredControlAfterScroll(
  page: Page,
  control: Locator,
  baseline: RequiredControlBaseline,
): Promise<RequiredControlReceipt> {
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(
    await page.evaluate(() => ({x: window.scrollX, y: window.scrollY})),
    `${baseline.label} reset window scroll`,
  ).toEqual({x: 0, y: 0});
  await control.scrollIntoViewIfNeeded();
  await expect(control, `${baseline.label} is visible after normal document scroll`)
    .toBeVisible();
  const afterScroll = await control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const left = Math.max(0, rect.left);
    const right = Math.min(window.innerWidth, rect.right);
    const top = Math.max(0, rect.top);
    const bottom = Math.min(window.innerHeight, rect.bottom);
    const visibleArea = Math.max(0, right - left) * Math.max(0, bottom - top);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(centerX, centerY);
    const nestedScrollableAncestors: Array<{
      className: string;
      scrollLeft: number;
      scrollTop: number;
    }> = [];
    for (
      let ancestor = element.parentElement;
      ancestor && ancestor !== document.documentElement;
      ancestor = ancestor.parentElement
    ) {
      const style = getComputedStyle(ancestor);
      const internallyScrollable =
        (/auto|scroll/u.test(style.overflowX) &&
          ancestor.scrollWidth > ancestor.clientWidth + 1) ||
        (/auto|scroll/u.test(style.overflowY) &&
          ancestor.scrollHeight > ancestor.clientHeight + 1);
      if (internallyScrollable) {
        nestedScrollableAncestors.push({
          className: ancestor.getAttribute('class') ?? '',
          scrollLeft: ancestor.scrollLeft,
          scrollTop: ancestor.scrollTop,
        });
      }
    }
    return {
      windowScroll: {x: window.scrollX, y: window.scrollY},
      viewportVisibleRatio: visibleArea / (rect.width * rect.height),
      centerPoint: {x: centerX, y: centerY},
      centerHitTarget: hit === element || (hit ? element.contains(hit) : false),
      nestedScrollableAncestors,
    };
  });
  expect(
    afterScroll.viewportVisibleRatio,
    `${baseline.label} is fully visible after normal document scroll`,
  ).toBeGreaterThanOrEqual(0.999);
  expect(afterScroll.centerHitTarget, `${baseline.label} receives center-point input`)
    .toBe(true);
  expect(
    afterScroll.nestedScrollableAncestors,
    `${baseline.label} uses document scrolling without an internal scroll container`,
  ).toEqual([]);
  return {
    ...baseline,
    afterScrollWindowScroll: afterScroll.windowScroll,
    nestedScrollableAncestorCount: afterScroll.nestedScrollableAncestors.length,
    nestedAncestorScrollOffsetsAfterScroll:
      afterScroll.nestedScrollableAncestors,
    viewportVisibleRatioAfterScroll: afterScroll.viewportVisibleRatio,
    centerPointAfterScroll: afterScroll.centerPoint,
    centerHitTarget: afterScroll.centerHitTarget,
  };
}

async function captureLayoutReceipt({
  locale,
  candidateModule,
  page,
}: {
  locale: 'en' | 'es';
  candidateModule: Locator;
  page: Page;
}): Promise<LayoutReceipt> {
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(
    await page.evaluate(() => ({x: window.scrollX, y: window.scrollY})),
    'layout evidence starts at the document origin',
  ).toEqual({x: 0, y: 0});
  const initial = await candidateModule.evaluate((section) => {
    const rect = (element: Element): RectReceipt => {
      const value = element.getBoundingClientRect();
      return {
        x: value.x,
        y: value.y,
        width: value.width,
        height: value.height,
        right: value.right,
        bottom: value.bottom,
      };
    };
    const overlapArea = (first: DOMRect, second: DOMRect) =>
      Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left)) *
      Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
    const source = section.querySelector('[data-source-safe-region="true"]');
    const interaction = section.querySelector('[data-interaction-panel="true"]');
    const controls = section.querySelector('[data-required-control-surface="true"]');
    const runtimeShell = section.closest('.runtime-shell');
    const reducedMotion = runtimeShell?.querySelector('.reduced-motion-note');
    const stage = section.closest('.lesson-shell2__stage');
    const legacyStage = section.closest('.lesson-shell2__legacy-stage');
    if (
      !source ||
      !interaction ||
      !controls ||
      !runtimeShell ||
      !reducedMotion ||
      !stage ||
      !legacyStage
    ) {
      throw new Error('Occurrence-29 flow-layout evidence surface is incomplete.');
    }
    const sourceRect = source.getBoundingClientRect();
    const interactionRect = interaction.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    const reducedMotionRect = reducedMotion.getBoundingClientRect();
    const controlsStyle = getComputedStyle(controls);
    const clipHosts = [stage, legacyStage].map((host) => {
      const style = getComputedStyle(host);
      return {
        className: host.getAttribute('class') ?? '',
        clientHeight: host.clientHeight,
        scrollHeight: host.scrollHeight,
        clientWidth: host.clientWidth,
        scrollWidth: host.scrollWidth,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
      };
    });
    return {
      initialWindowScroll: {x: window.scrollX, y: window.scrollY},
      sourceSafeRegion: rect(source),
      interactionPanel: rect(interaction),
      requiredControlSurface: rect(controls),
      reducedMotionNotice: rect(reducedMotion),
      sourceInteractionOverlapArea: overlapArea(sourceRect, interactionRect),
      sourceReducedMotionOverlapArea: overlapArea(sourceRect, reducedMotionRect),
      normalFlowOrder:
        reducedMotionRect.bottom <= sourceRect.top + 1 &&
        sourceRect.bottom <= interactionRect.top + 1 &&
        interactionRect.bottom <= controlsRect.top + 1,
      documentHorizontalOverflowPx: Math.max(
        0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
      requiredControlSurfaceOverflow: {
        clientHeight: controls.clientHeight,
        scrollHeight: controls.scrollHeight,
        clientWidth: controls.clientWidth,
        scrollWidth: controls.scrollWidth,
        overflowX: controlsStyle.overflowX,
        overflowY: controlsStyle.overflowY,
      },
      clipHosts,
    };
  });

  expect(initial.initialWindowScroll, 'layout initial window scroll')
    .toEqual({x: 0, y: 0});
  expect(initial.sourceInteractionOverlapArea, 'interaction panel/source overlap')
    .toBe(0);
  expect(initial.sourceReducedMotionOverlapArea, 'motion notice/source overlap')
    .toBe(0);
  expect(initial.normalFlowOrder, 'motion, source, interaction, and controls flow order')
    .toBe(true);
  expect(initial.documentHorizontalOverflowPx, 'document horizontal overflow')
    .toBe(0);
  expect(
    Math.abs(
      initial.sourceSafeRegion.width / initial.sourceSafeRegion.height - 4 / 3,
    ),
    'source-safe canvas keeps its 4:3 aspect ratio',
  ).toBeLessThanOrEqual(0.01);
  expect(
    initial.requiredControlSurfaceOverflow.scrollHeight,
    'required control surface has no hidden vertical overflow',
  ).toBeLessThanOrEqual(
    initial.requiredControlSurfaceOverflow.clientHeight + 1,
  );
  expect(
    initial.requiredControlSurfaceOverflow.scrollWidth,
    'required control surface has no hidden horizontal overflow',
  ).toBeLessThanOrEqual(
    initial.requiredControlSurfaceOverflow.clientWidth + 1,
  );
  for (const host of initial.clipHosts) {
    expect(
      host.scrollHeight,
      `${host.className} vertical content is not clipped`,
    ).toBeLessThanOrEqual(host.clientHeight + 1);
    expect(
      host.scrollWidth,
      `${host.className} horizontal content is not clipped`,
    ).toBeLessThanOrEqual(host.clientWidth + 1);
  }

  const requiredControls: Array<[string, Locator]> = glossaryHandlers.map(
    ([sourceIntent], index): [string, Locator] => [
      `Glossary ${index + 1}: ${sourceIntent}`,
      candidateModule.locator(
        `[data-p5-1-required-control="glossary-${String(index + 1).padStart(2, '0')}"]`,
      ),
    ],
  );
  requiredControls.push([
    locale === 'en' ? 'Play audio' : 'Reproducir audio',
    candidateModule.locator('[data-p5-1-required-control="audio"]'),
  ]);
  requiredControls.push([
    locale === 'en' ? 'Replay' : 'Repetir',
    candidateModule.locator('[data-p5-1-required-control="replay"]'),
  ]);
  const controlBaselines: RequiredControlBaseline[] = [];
  for (const [label, control] of requiredControls) {
    controlBaselines.push(await captureRequiredControlBaseline(control, label));
  }
  const controlReceipts: RequiredControlReceipt[] = [];
  for (let index = 0; index < requiredControls.length; index += 1) {
    controlReceipts.push(await captureRequiredControlAfterScroll(
      page,
      requiredControls[index]![1],
      controlBaselines[index]!,
    ));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return {...initial, requiredControls: controlReceipts};
}

async function selectOccurrence29(page: Page) {
  const player = page.locator(
    '[data-lesson-player="descriptor-driven-page-only-product-bridge"]',
  );
  await expect(player).toHaveAttribute('data-hydrated', 'true');
  await expect(player).toHaveAttribute('data-current-placement-id', placementId);
  await expect(player).toHaveAttribute('data-current-animation-id', animationId);
  return player;
}

async function runBoundedQa({
  browser,
  baseURL,
  evidenceBoundary,
  locale,
  viewport,
  outputDirectory,
}: {
  browser: Browser;
  baseURL: string;
  evidenceBoundary: EvidenceBoundaryReceipt;
  locale: 'en' | 'es';
  viewport: {width: number; height: number};
  outputDirectory: 'desktop-en-1440x1000' | 'mobile-es-390x844';
}): Promise<CaptureReceipt> {
  if (!evidenceRoot) {
    throw new Error('HELP_MATH_P51_V2_EVIDENCE_ROOT is required.');
  }
  const context = await browser.newContext({
    baseURL,
    locale: locale === 'en' ? 'en-US' : 'es-ES',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    viewport,
  });
  await context.addInitScript(({key, release, placement, language}) => {
    window.localStorage.setItem(key, JSON.stringify({
      schemaVersion: 1,
      releaseId: release,
      currentAnimationId: placement,
      locale: language,
      visitedAnimationIds: [placement],
      reviewedAnimationIds: [],
      replayCounts: {},
    }));
  }, {
    key: storageKey,
    release: privateBridgeReleaseId,
    placement: placementId,
    language: locale,
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestLedger: HttpRequestLedgerEntry[] = [];
  const requestEntries = new Map<Request, HttpRequestLedgerEntry>();
  const inFlightHttpRequests = new Set<Request>();
  const allowedBaseUrl = new URL(baseURL);
  expect(allowedBaseUrl.protocol, 'browser QA uses local HTTP').toBe('http:');
  expect(
    new Set(['127.0.0.1', 'localhost', '[::1]']).has(
      allowedBaseUrl.hostname,
    ),
    'browser QA origin is loopback-only',
  ).toBe(true);
  const allowedOrigin = allowedBaseUrl.origin;
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (browserResponse) => {
    const entry = requestEntries.get(browserResponse.request());
    if (entry) {
      entry.responseStatus = browserResponse.status();
    }
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    const method = request.method();
    const explicitModernLocalPath =
      url.pathname === `/${locale}${route}` ||
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/flash-assets/courses/course-g04-l09-') ||
      url.pathname === '/learning-theme-bootstrap.js' ||
      url.pathname === '/robots.txt';
    const legacyIntent =
      /geturl|report|final-quiz-post|legacy-endpoint|xml-send/iu.test(url.href);
    const classification: HttpRequestClassification =
      url.origin !== allowedOrigin || legacyIntent
        ? 'forbidden-origin-or-legacy'
        : !explicitModernLocalPath || !new Set(['GET', 'HEAD']).has(method)
          ? 'unexpected-local-path-or-method'
          : 'allowed';
    const entry: HttpRequestLedgerEntry = {
      sequence: requestLedger.length + 1,
      method,
      resourceType: request.resourceType(),
      url: url.href,
      classification,
      responseStatus: null,
      terminalState: 'pending',
      failure: null,
    };
    requestLedger.push(entry);
    requestEntries.set(request, entry);
    inFlightHttpRequests.add(request);
  });
  page.on('requestfinished', (request) => {
    const entry = requestEntries.get(request);
    if (!entry) return;
    entry.terminalState = 'finished';
    inFlightHttpRequests.delete(request);
  });
  page.on('requestfailed', (request) => {
    const entry = requestEntries.get(request);
    if (!entry) return;
    entry.terminalState = 'failed';
    entry.failure = request.failure()?.errorText ?? 'unknown request failure';
    inFlightHttpRequests.delete(request);
  });

  const response = await page.goto(`/${locale}${route}`);
  const navigationStatus = response?.status() ?? 0;
  expect(navigationStatus).toBe(200);
  const player = await selectOccurrence29(page);
  await expect(player).toHaveAttribute('data-current-page', '29');
  await expect(player).toHaveAttribute('data-renderer-availability', 'registered');
  await expect(player).toHaveAttribute('data-unavailable-pages', '27');
  await expect(player).toHaveAttribute('data-page-audio-acceptance', 'not-established');
  await expect(player).toHaveAttribute('data-page-actionscript-execution', 'not-executed');

  const candidateModule = page.locator(
    `[data-private-current-js="true"][data-animation-id="${animationId}"]`,
  );
  const runtimeStage = candidateModule.locator('..');
  const runtimeShell = runtimeStage.locator('..');
  await expect(candidateModule).toBeVisible();
  await expect(candidateModule).toHaveAttribute('data-source-occurrence', '29');
  await expect(candidateModule).toHaveAttribute(
    'data-random-cycle-adapter',
    'rndAudio-source-array-seeded-cycle-v1',
  );
  await expect(candidateModule).toHaveAttribute('data-do-get-rnd-quest-adapter', 'not-applicable');
  await expect(candidateModule).toHaveAttribute('data-host-symbol-count', '20');
  await expect(candidateModule).toHaveAttribute('data-drag-correct', 'Scr2,Scr3,Scr4,Scr5');
  await expect(candidateModule).toHaveAttribute('data-drag-incorrect', 'Scr1,Scr6');
  await expect(candidateModule).toHaveAttribute('data-network-calls', '0');
  await expect(candidateModule).toHaveAttribute('data-original-runtime-validated', 'false');
  await expect(candidateModule).toHaveAttribute('data-fidelity-accepted', 'false');
  await expect(candidateModule).toHaveAttribute(
    'data-product-layout',
    'source-controls-flow-v2',
  );
  await expect(candidateModule.locator('[data-p5-1-required-control]')).toHaveCount(14);
  await expect(runtimeStage).toHaveAttribute('data-flash-frame-domain', 'sprite-134');
  await expect(runtimeStage).toHaveAttribute(
    'data-runtime-scenario',
    'p5-1-occurrence-29-bounded',
  );
  const initialChoiceOrder = await candidateModule.getAttribute('data-choice-order');
  const initialChoiceLabel = await candidateModule.getAttribute('data-choice-label');
  expect(initialChoiceOrder).toMatch(/^\d,\d,\d,\d$/u);
  expect(new Set(initialChoiceOrder!.split(','))).toEqual(new Set(['0', '1', '2', '3']));
  expect(initialChoiceLabel).toMatch(/^S[1-4]$/u);
  const layout = await captureLayoutReceipt({locale, candidateModule, page});

  expect(await candidateModule.locator('[aria-label^="Glossary "]').count()).toBe(12);
  for (let index = 0; index < glossaryHandlers.length; index += 1) {
    const [sourceIntent, entryId, sourceKey] = glossaryHandlers[index]!;
    await candidateModule.getByRole('button', {
      name: `Glossary ${index + 1}: ${sourceIntent}`,
      exact: true,
    }).click();
    await expect(candidateModule).toHaveAttribute('data-host-decision', 'allowed');
    const dialog = page.locator(`[data-glossary-entry-id="${entryId}"]`);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-source-key-attribute', sourceKey);
    await expect(dialog).toHaveAttribute('data-glossary-storage', 'memory-only');
    await dialog.getByRole('button', {
      name: locale === 'en' ? 'Close and continue' : 'Cerrar y continuar',
    }).click();
  }

  const playAudio = () => candidateModule.getByRole('button', {
    name: locale === 'en' ? 'Play audio' : 'Reproducir audio',
    exact: true,
  });
  await playAudio().click();
  await expect(candidateModule).toHaveAttribute('data-audio-lifecycle', 'requested');
  await expect(runtimeShell).toHaveAttribute(
    'data-interactive-audio-playing',
    `${animationId}-narration`,
  );
  await candidateModule.getByRole('button', {
    name: locale === 'en' ? 'Replay' : 'Repetir',
    exact: true,
  }).click();
  await expect(candidateModule).toHaveAttribute('data-audio-lifecycle', 'idle');
  await expect(candidateModule).toHaveAttribute('data-try-count', '0');
  await expect(candidateModule).toHaveAttribute('data-question-index', '1');
  await expect(candidateModule).toHaveAttribute('data-correct-placements', '');
  const replayChoiceOrder = await candidateModule.getAttribute('data-choice-order');
  const replayChoiceLabel = await candidateModule.getAttribute('data-choice-label');
  expect(replayChoiceOrder).toMatch(/^\d,\d,\d,\d$/u);
  expect(new Set(replayChoiceOrder!.split(','))).toEqual(
    new Set(['0', '1', '2', '3']),
  );
  expect(replayChoiceLabel).toBe(
    `S${Number(replayChoiceOrder!.split(',')[0]!) + 1}`,
  );
  await expect(runtimeShell).not.toHaveAttribute('data-interactive-audio-playing', /.+/u);

  const drops = locale === 'en'
    ? ['Drop Scr1', 'Drop Scr2', 'Drop Scr3', 'Drop Scr4', 'Drop Scr5']
    : ['Soltar Scr1', 'Soltar Scr2', 'Soltar Scr3', 'Soltar Scr4', 'Soltar Scr5'];
  const feedback = locale === 'en'
    ? ['Try the next question.', 'Correct.', 'Correct.', 'Correct.']
    : ['Inténtalo de nuevo en la próxima pregunta.', 'Correcto.', 'Correcto.', 'Correcto.'];
  for (let index = 0; index < drops.length; index += 1) {
    await candidateModule.getByRole('button', {name: drops[index]!, exact: true}).click();
    await expect(candidateModule).toHaveAttribute('data-try-count', String(index + 1));
    await expect(candidateModule).toHaveAttribute('data-score', String(Math.max(0, index)));
    if (index < 4) {
      await expect(candidateModule.locator('[data-feedback]')).toHaveText(feedback[index]!);
      await candidateModule.getByRole('button', {
        name: locale === 'en' ? 'Next' : 'Siguiente',
        exact: true,
      }).click();
    }
  }
  await expect(candidateModule).toHaveAttribute('data-terminal', 'true');
  await expect(candidateModule).toHaveAttribute('data-score', '4');
  await expect(candidateModule).toHaveAttribute('data-correct-placement-count', '4');
  await expect(candidateModule).toHaveAttribute('data-correct-placements', 'Scr2,Scr3,Scr4,Scr5');
  await expect(candidateModule.locator('[data-final="true"]')).toContainText('Final: 4/4');
  await candidateModule.locator('[data-final="true"] button').click();
  await expect(candidateModule).toHaveAttribute('data-terminal', 'false');
  await expect(candidateModule).toHaveAttribute('data-score', '0');
  await expect(candidateModule).toHaveAttribute('data-attempts', '0');
  await expect(candidateModule).toHaveAttribute('data-try-count', '0');
  await expect(candidateModule).toHaveAttribute('data-correct-placement-count', '0');
  await expect(candidateModule).toHaveAttribute('data-correct-placements', '');
  const completedReplayChoiceOrder = await candidateModule.getAttribute('data-choice-order');
  const completedReplayChoiceLabel = await candidateModule.getAttribute('data-choice-label');
  expect(completedReplayChoiceOrder).toMatch(/^\d,\d,\d,\d$/u);
  expect(new Set(completedReplayChoiceOrder!.split(','))).toEqual(
    new Set(['0', '1', '2', '3']),
  );
  expect(completedReplayChoiceLabel).toBe(
    `S${Number(completedReplayChoiceOrder!.split(',')[0]!) + 1}`,
  );

  await playAudio().click();
  await expect(candidateModule).toHaveAttribute('data-audio-lifecycle', 'requested');
  const shellReplay = player.locator(
    'button[data-responsive-focus-key="replay"]:visible',
  );
  await expect(shellReplay).toHaveCount(1);
  await shellReplay.click();
  await expect(candidateModule).toHaveAttribute('data-audio-lifecycle', 'idle');
  await expect(candidateModule).toHaveAttribute('data-try-count', '0');
  await expect(runtimeShell).not.toHaveAttribute('data-interactive-audio-playing', /.+/u);

  await playAudio().click();
  await expect(candidateModule).toHaveAttribute('data-audio-lifecycle', 'requested');
  await page.getByRole('button', {
    name: locale === 'en' ? 'Next page' : 'Página siguiente',
    exact: true,
  }).click();
  await expect(player).toHaveAttribute('data-current-page', '30');
  await expect(page.locator(
    '[data-runtime-presentation="modern-wide"][data-interactive-audio-playing]',
  )).toHaveCount(0);
  await page.getByRole('button', {
    name: locale === 'en' ? '← Previous' : '← Anterior',
    exact: true,
  }).click();
  await expect(player).toHaveAttribute('data-current-page', '29');
  await expect(candidateModule).toHaveAttribute('data-try-count', '0');
  await page.getByRole('button', {
    name: locale === 'en' ? '← Previous' : '← Anterior',
    exact: true,
  }).click();
  await expect(player).toHaveAttribute('data-current-page', '28');
  await page.getByRole('button', {
    name: locale === 'en' ? 'Next page' : 'Página siguiente',
    exact: true,
  }).click();
  await expect(player).toHaveAttribute('data-current-page', '29');
  await expect(candidateModule).toHaveAttribute('data-network-calls', '0');

  let spanishTitleState: CaptureReceipt['spanishTitleState'] = 'not-applicable';
  if (locale === 'es') {
    await expect(page.getByText(
      'La fuente no proporciona un título en español; se conserva el título original en inglés.',
      {exact: true},
    )).toBeVisible();
    await expect(page.getByText(
      'El candidato visual current-JS permanece limitado al contenido fuente en inglés.',
      {exact: true},
    )).toBeVisible();
    spanishTitleState = 'english-source-fallback-disclosed';
  }

  const relativeOutput =
    `reports/browser-qa/g4-l9-p5-1/v2/${outputDirectory}/029-course-g04-l09-ti-004-v2.png`;
  const output = path.join(evidenceRoot, relativeOutput);
  await prepareEvidenceOutputParent(output, evidenceBoundary);
  await page.waitForLoadState('networkidle');
  await expect.poll(
    () => inFlightHttpRequests.size,
    {message: 'all HTTP requests reach a terminal state before capture'},
  ).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  const bytes = await page.screenshot({animations: 'disabled', fullPage: true});
  await writeFile(output, bytes, {flag: 'wx'});
  expect(await readFile(output)).toEqual(bytes);
  await page.waitForLoadState('networkidle');
  await expect.poll(
    () => inFlightHttpRequests.size,
    {message: 'all HTTP requests reach a terminal state after capture'},
  ).toBe(0);
  const browserVersion = browser.version();
  await context.close();

  const formatRequest = (entry: HttpRequestLedgerEntry) =>
    `${entry.method} ${entry.resourceType} ${entry.url}`;
  const allowedRequests = requestLedger.filter(
    (entry) => entry.classification === 'allowed',
  );
  const forbiddenRequests = requestLedger.filter(
    (entry) => entry.classification === 'forbidden-origin-or-legacy',
  );
  const unexpectedRequests = requestLedger.filter(
    (entry) => entry.classification === 'unexpected-local-path-or-method',
  );
  const finishedRequests = requestLedger.filter(
    (entry) => entry.terminalState === 'finished',
  );
  const failedRequests = requestLedger.filter(
    (entry) => entry.terminalState === 'failed',
  );
  const unfinishedRequests = requestLedger.filter(
    (entry) => entry.terminalState === 'pending',
  );
  const finishedWithoutResponse = finishedRequests.filter(
    (entry) => entry.responseStatus === null,
  );
  const httpErrorResponses = requestLedger.filter(
    (entry) => (entry.responseStatus ?? 0) >= 400,
  );
  expect(consoleErrors, 'browser console errors').toEqual([]);
  expect(pageErrors, 'uncaught page errors').toEqual([]);
  expect(failedRequests, 'failed browser requests').toEqual([]);
  expect(forbiddenRequests, 'external-origin or legacy-intent requests')
    .toEqual([]);
  expect(unexpectedRequests, 'unexpected browser HTTP requests').toEqual([]);
  expect(unfinishedRequests, 'unfinished browser HTTP requests').toEqual([]);
  expect(finishedWithoutResponse, 'finished HTTP requests have response status')
    .toEqual([]);
  expect(httpErrorResponses, 'HTTP error responses').toEqual([]);
  expect(inFlightHttpRequests.size, 'in-flight HTTP requests after context close')
    .toBe(0);
  expect(
    requestLedger.length,
    'total requests equal allowed plus forbidden plus unexpected',
  ).toBe(
    allowedRequests.length +
      forbiddenRequests.length +
      unexpectedRequests.length,
  );
  expect(
    requestLedger.length,
    'every HTTP request reaches finished or failed terminal state',
  ).toBe(finishedRequests.length + failedRequests.length);
  const network: NetworkReceipt = {
    normalizedAllowedOrigin: allowedOrigin,
    navigationStatus,
    totalHttpRequests: requestLedger.length,
    allowedHttpRequests: allowedRequests.length,
    forbiddenHttpRequests: forbiddenRequests.length,
    unexpectedHttpRequests: unexpectedRequests.length,
    finishedHttpRequests: finishedRequests.length,
    failedHttpRequests: failedRequests.length,
    unfinishedHttpRequests: unfinishedRequests.length,
    httpErrorResponses: httpErrorResponses.length,
    requests: requestLedger,
    allowed: allowedRequests.map(formatRequest),
    forbidden: forbiddenRequests.map(formatRequest),
    unexpected: unexpectedRequests.map(formatRequest),
    failed: failedRequests.map(
      (entry) => `${formatRequest(entry)} :: ${entry.failure ?? ''}`,
    ),
    httpErrors: httpErrorResponses.map(
      (entry) => `${entry.responseStatus} ${formatRequest(entry)}`,
    ),
  };
  return {
    path: relativeOutput,
    bytes: bytes.length,
    sha256: digest(bytes),
    browserVersion,
    locale,
    viewport,
    layout,
    network,
    consoleErrors: consoleErrors.length,
    pageErrors: pageErrors.length,
    failedRequests: failedRequests.length,
    forbiddenRequests: forbiddenRequests.length,
    spanishTitleState,
  };
}

test('P5.1 occurrence-29 visual remediation passes real modern My Lesson desktop EN and mobile ES', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(300_000);
  test.skip(
    !evidenceRootInput,
    'Append-only v2 QA requires HELP_MATH_P51_V2_EVIDENCE_ROOT.',
  );
  expect(
    process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER ?? '',
    'browser QA launches a fresh server from the committed subject',
  ).toBe('');
  expect(expectedHeadInput, 'controller-provided expected HEAD is required')
    .toBeTruthy();
  expect(
    process.env.MODERN_WIDE_SHELL_ENABLED,
    'visual remediation QA requires the modern My Lesson host',
  ).toBe('true');
  expect(receiptPath).toBeTruthy();
  expect(baseURL).toBeTruthy();
  const testedSubject = await captureTestedSubject();
  const evidenceBoundary = await establishEvidenceBoundary(testedSubject);
  await verifyImmutableV1Evidence();
  const captures = [
    await runBoundedQa({
      browser,
      baseURL: baseURL!,
      evidenceBoundary,
      locale: 'en',
      viewport: {width: 1440, height: 1000},
      outputDirectory: 'desktop-en-1440x1000',
    }),
    await runBoundedQa({
      browser,
      baseURL: baseURL!,
      evidenceBoundary,
      locale: 'es',
      viewport: {width: 390, height: 844},
      outputDirectory: 'mobile-es-390x844',
    }),
  ];
  await verifyImmutableV1Evidence();
  expect(await captureTestedSubject(), 'subject identity remains stable after QA')
    .toEqual(testedSubject);
  const receipt = {
    schemaVersion: 2,
    artifactKind: 'g4-l9-p5-1-occurrence-29-browser-qa-receipt-v2',
    taskId,
    result: 'PASS',
    gate: 'automated-modern-my-lesson-layout-behavior-and-network-qa',
    testedSubject,
    evidenceBoundary,
    browser: {
      automation: '@playwright/test',
      engine: browser.browserType().name(),
      version: browser.version(),
      platform: process.platform,
      arch: process.arch,
      serviceWorkers: 'block',
      reuseExistingServer: false,
      host: 'real local modern My Lesson',
    },
    route,
    privateOnly: true,
    defaultProductionRoute: '404-required-separate-build-gate',
    exercised: [
      'deterministic-S1-S4-random-cycle',
      'Scr1-through-Scr6-source-outcomes',
      '12-source-glossary-handlers-and-explicit-typo-alias',
      'source-safe-region-and-interaction-panel-zero-overlap',
      'reduced-motion-notice-and-source-safe-region-zero-overlap',
      '14-required-controls-no-ancestor-clipping-and-center-hit-testing',
      'desktop-and-mobile-horizontal-overflow-zero',
      'correct-and-incorrect-feedback',
      'four-unique-correct-terminal-state',
      'try-and-choice-state',
      'renderer-Replay-complete-reset-with-active-audio',
      'modern-My-Lesson-Replay-complete-reset-with-active-audio',
      'Previous-and-Next-navigation',
      'navigation-unmount-audio-stop-and-state-reset',
      'Spanish-source-title-fallback-disclosure',
      'deny-external-legacy-and-unknown-network',
      'complete-browser-http-request-and-error-response-ledger',
    ],
    preservedV1FailureEvidence: {
      browserReceipt: {
        path: 'reports/g4-l9-p5-1-occurrence-29-browser-qa-receipt-v1.json',
        sha256: '1f69d621eb39b59d2956117a772f020010ec3cb6cafd7ca7d921ddbc8007a920',
      },
      desktopScreenshot: {
        path: 'reports/browser-qa/g4-l9-p5-1/desktop-en-1440x1000/029-course-g04-l09-ti-004.png',
        sha256: '63a767290dcfd7762404280037e9a70042fc9458b79331524f16f18a4b84946a',
      },
      mobileScreenshot: {
        path: 'reports/browser-qa/g4-l9-p5-1/mobile-es-390x844/029-course-g04-l09-ti-004.png',
        sha256: '4d03814e16211ceb9b0cb72dbd649f4446705979421821932db7033444c2702c',
      },
      phaseBNoGoReceiptCommit:
        'f40b0a3befc1c8f6f263cb58173e3fbecccde4e9',
      overwritten: false,
    },
    captures,
    automatedGateEffects: {
      modernMyLessonLayoutBehaviorAndNetworkQaPassed: true,
    },
    authorityEffects: authorityEffectsAllFalse,
  };
  await prepareEvidenceOutputParent(receiptPath!, evidenceBoundary);
  await writeFile(receiptPath!, `${JSON.stringify(receipt, null, 2)}\n`, {
    flag: 'wx',
  });
});
