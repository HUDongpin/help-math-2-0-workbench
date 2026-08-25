import {createHash} from 'node:crypto';
import {
  constants,
  mkdir,
  open,
} from 'node:fs/promises';
import path from 'node:path';

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
} from '@playwright/test/reporter';

const ARTIFACT_TYPE = 'canvas-resolution-playwright-run-report';
const SHA256 = /^[a-f0-9]{64}$/u;

interface ReporterOptions {
  readonly workspaceRoot: string;
  readonly outputDirectory: string;
  readonly requiredInputs: readonly string[];
}

interface PendingAttachment {
  readonly name: string;
  readonly contentType: string;
  readonly path?: string;
  readonly body?: Buffer;
}

interface PendingTestResult {
  readonly id: string;
  readonly projectName: string;
  readonly titlePath: readonly string[];
  readonly location: {
    readonly file: string;
    readonly line: number;
    readonly column: number;
  };
  readonly expectedStatus: string;
  readonly actualStatus: string;
  readonly outcome: string;
  readonly retry: number;
  readonly durationMs: number;
  readonly startTime: string;
  readonly annotations: ReadonlyArray<{
    readonly type: string;
    readonly description: string | null;
  }>;
  readonly errors: readonly TestError[];
  readonly attachments: readonly PendingAttachment[];
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [
          key,
          canonicalize((value as Record<string, unknown>)[key]),
        ]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value: Buffer | string) {
  return createHash('sha256').update(value).digest('hex');
}

function portable(value: string) {
  return value.split(path.sep).join('/');
}

function displayPath(workspaceRoot: string, candidate: string) {
  const relative = path.relative(workspaceRoot, candidate);
  if (relative !== '..' && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)) {
    return portable(relative);
  }
  return portable(candidate);
}

function boundedText(value: unknown) {
  const text = typeof value === 'string' ? value : String(value ?? '');
  return text.replaceAll('\u0000', '').slice(0, 2_000);
}

function errorRecord(error: TestError) {
  return {
    message: boundedText(error.message ?? error.value ?? 'unknown error'),
    location: error.location ? {
      file: portable(error.location.file),
      line: error.location.line,
      column: error.location.column,
    } : null,
  };
}

async function readStableFile(candidate: string) {
  const handle = await open(
    candidate,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );
  try {
    const before = await handle.stat({bigint: true});
    invariant(before.isFile(),
      `${candidate} must be an ordinary non-symlink file`);
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    invariant(
      before.dev === after.dev &&
        before.ino === after.ino &&
        before.size === after.size &&
        before.mtimeNs === after.mtimeNs &&
        before.ctimeNs === after.ctimeNs &&
        BigInt(bytes.length) === after.size,
      `${candidate} changed while it was hashed`,
    );
    return {
      bytes: bytes.length,
      sha256: sha256(bytes),
    };
  } finally {
    await handle.close();
  }
}

async function bindRequiredInput(
  workspaceRoot: string,
  candidate: string,
) {
  const absolute = path.resolve(workspaceRoot, candidate);
  try {
    return {
      path: displayPath(workspaceRoot, absolute),
      status: 'bound' as const,
      ...await readStableFile(absolute),
    };
  } catch (error) {
    return {
      path: displayPath(workspaceRoot, absolute),
      status: 'missing-or-unstable' as const,
      error: boundedText((error as Error).message),
    };
  }
}

async function bindAttachment(
  workspaceRoot: string,
  attachment: PendingAttachment,
) {
  invariant(!(attachment.path && attachment.body),
    `${attachment.name} attachment cannot contain both path and body`);
  if (attachment.body) {
    return {
      name: attachment.name,
      contentType: attachment.contentType,
      source: 'body' as const,
      status: 'bound' as const,
      bytes: attachment.body.length,
      sha256: sha256(attachment.body),
    };
  }
  invariant(attachment.path,
    `${attachment.name} attachment has neither path nor body`);
  return {
    name: attachment.name,
    contentType: attachment.contentType,
    source: 'path' as const,
    status: 'bound' as const,
    path: displayPath(workspaceRoot, path.resolve(attachment.path)),
    ...await readStableFile(path.resolve(attachment.path)),
  };
}

function validateBrowserEnvironmentAttachment(
  attachment: PendingAttachment,
  expectedProjectName: string,
  runMetadata: unknown,
) {
  invariant(attachment.contentType === 'application/json' && attachment.body,
    'browser environment attachment must be inline application/json');
  let document: Record<string, unknown>;
  try {
    document = JSON.parse(attachment.body.toString('utf8')) as
      Record<string, unknown>;
  } catch (error) {
    throw new Error(`browser environment attachment is invalid JSON: ${
      (error as Error).message
    }`);
  }
  invariant(JSON.stringify(Object.keys(document).sort()) === JSON.stringify([
    'architecture',
    'artifactType',
    'baseURL',
    'browserName',
    'browserVersion',
    'nodeVersion',
    'performanceScope',
    'platform',
    'projectName',
    'schemaVersion',
    'userAgent',
  ]), 'browser environment attachment fields are invalid');
  const metadata = runMetadata as {
    readonly baseURL?: unknown;
    readonly performanceScope?: unknown;
  } | null;
  invariant(
    document.schemaVersion === 1 &&
      document.artifactType === 'canvas-resolution-browser-environment' &&
      document.projectName === expectedProjectName &&
      document.baseURL === metadata?.baseURL &&
      document.performanceScope === metadata?.performanceScope &&
      (document.browserName === 'chromium' ||
        document.browserName === 'firefox' ||
        document.browserName === 'webkit') &&
      [
        document.browserVersion,
        document.userAgent,
        document.nodeVersion,
        document.platform,
        document.architecture,
      ].every((value) => typeof value === 'string' && value.length > 0),
    `${expectedProjectName} browser environment attachment is invalid`,
  );
}

export function makeHashBoundRunReport(payload: unknown) {
  const unsigned = {
    schemaVersion: 1,
    artifactType: ARTIFACT_TYPE,
    payload,
  };
  return {
    ...unsigned,
    contentSha256: sha256(canonicalJson(unsigned)),
  };
}

export function verifyHashBoundRunReport(document: ReturnType<
  typeof makeHashBoundRunReport
>) {
  invariant(document.schemaVersion === 1 &&
    document.artifactType === ARTIFACT_TYPE &&
    SHA256.test(document.contentSha256),
  'Canvas resolution Playwright report identity is invalid');
  invariant(document.contentSha256 === sha256(canonicalJson({
    schemaVersion: document.schemaVersion,
    artifactType: document.artifactType,
    payload: document.payload,
  })), 'Canvas resolution Playwright report content hash is invalid');
}

export default class CanvasResolutionHashReporter implements Reporter {
  readonly #options: ReporterOptions;
  #listOnly = false;
  #plannedTestCount = 0;
  #plannedTestIds = new Set<string>();
  #projects: string[] = [];
  #projectContracts: Array<Record<string, unknown>> = [];
  #runMetadata: unknown = null;
  #configFile = '';
  #results: PendingTestResult[] = [];
  #globalErrors: TestError[] = [];

  constructor(options: ReporterOptions) {
    invariant(options && path.isAbsolute(options.workspaceRoot),
      'workspaceRoot must be absolute');
    invariant(path.isAbsolute(options.outputDirectory),
      'outputDirectory must be absolute');
    invariant(Array.isArray(options.requiredInputs) &&
      options.requiredInputs.length > 0 &&
      options.requiredInputs.every((value) =>
        typeof value === 'string' && value.length > 0),
    'requiredInputs must be a non-empty path list');
    this.#options = options;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.#listOnly = config.argv.includes('--list');
    this.#plannedTestIds = new Set(suite.allTests().map(({id}) => id));
    this.#plannedTestCount = this.#plannedTestIds.size;
    this.#projects = config.projects.map(({name}) => name);
    this.#projectContracts = config.projects.map((project) => ({
      name: project.name,
      outputDir: displayPath(this.#options.workspaceRoot, project.outputDir),
      repeatEach: project.repeatEach,
      retries: project.retries,
      use: {
        baseURL: project.use.baseURL ?? null,
        browserName: project.use.browserName ?? null,
        channel: project.use.channel ?? null,
        deviceScaleFactor: project.use.deviceScaleFactor ?? null,
        locale: project.use.locale ?? null,
        viewport: project.use.viewport ?? null,
      },
    }));
    this.#runMetadata = config.metadata.canvasResolutionRun ?? null;
    this.#configFile = config.configFile ?? '';
  }

  onError(error: TestError) {
    this.#globalErrors.push(error);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.#results.push({
      id: test.id,
      projectName: test.parent.project()?.name ?? 'unknown-project',
      titlePath: test.titlePath(),
      location: {
        file: displayPath(this.#options.workspaceRoot, test.location.file),
        line: test.location.line,
        column: test.location.column,
      },
      expectedStatus: test.expectedStatus,
      actualStatus: result.status,
      outcome: test.outcome(),
      retry: result.retry,
      durationMs: result.duration,
      startTime: result.startTime.toISOString(),
      annotations: result.annotations.map(({type, description}) => ({
        type,
        description: description ?? null,
      })),
      errors: result.errors,
      attachments: result.attachments,
    });
  }

  async onEnd(result: FullResult) {
    if (this.#listOnly) return;
    try {
      const requiredInputs = await Promise.all(
        this.#options.requiredInputs.map((candidate) =>
          bindRequiredInput(this.#options.workspaceRoot, candidate)),
      );
      const tests = [];
      let attachmentClosurePassed = true;
      for (const pending of this.#results) {
        const attachments = [];
        for (const attachment of pending.attachments) {
          try {
            if (attachment.name === 'canvas-resolution-browser-environment') {
              validateBrowserEnvironmentAttachment(
                attachment,
                pending.projectName,
                this.#runMetadata,
              );
            }
            attachments.push(await bindAttachment(
              this.#options.workspaceRoot,
              attachment,
            ));
          } catch (error) {
            attachmentClosurePassed = false;
            attachments.push({
              name: attachment.name,
              contentType: attachment.contentType,
              source: attachment.path ? 'path' : 'body',
              status: 'missing-or-unstable',
              error: boundedText((error as Error).message),
            });
          }
        }
        tests.push({
          ...pending,
          errors: pending.errors.map(errorRecord),
          attachments,
        });
      }
      tests.sort((left, right) =>
        `${left.projectName}\u0000${left.id}\u0000${left.retry}`.localeCompare(
          `${right.projectName}\u0000${right.id}\u0000${right.retry}`,
        ));
      const requiredInputClosurePassed = requiredInputs.every(
        ({status}) => status === 'bound',
      );
      const completedTestIds = new Set(tests.map(({id}) => id));
      const allResultsRecorded = [...this.#plannedTestIds].every((id) =>
        completedTestIds.has(id));
      const environmentProjects = new Set(
        tests.flatMap((testResult) => testResult.attachments
          .filter(({name}) =>
            name === 'canvas-resolution-browser-environment')
          .filter(({status}) => status === 'bound')
          .map(() => testResult.projectName)),
      );
      const browserEnvironmentClosurePassed =
        environmentProjects.size === this.#projects.length &&
        this.#projects.every((project) => environmentProjects.has(project));
      const effectiveStatus = result.status === 'passed' &&
        requiredInputClosurePassed && attachmentClosurePassed &&
        allResultsRecorded && browserEnvironmentClosurePassed &&
        this.#globalErrors.length === 0
        ? 'passed'
        : 'failed';
      const payload = {
        run: {
          startTime: result.startTime.toISOString(),
          durationMs: result.duration,
          playwrightStatus: result.status,
          effectiveStatus,
          plannedTestCount: this.#plannedTestCount,
          completedResultCount: tests.length,
          projectNames: [...this.#projects].sort(),
          projectContracts: this.#projectContracts,
          runMetadata: this.#runMetadata,
          configFile: displayPath(
            this.#options.workspaceRoot,
            this.#configFile || this.#options.workspaceRoot,
          ),
        },
        closure: {
          requiredInputClosurePassed,
          attachmentClosurePassed,
          allResultsRecorded,
          browserEnvironmentClosurePassed,
        },
        requiredInputs,
        tests,
        globalErrors: this.#globalErrors.map(errorRecord),
      };
      const document = makeHashBoundRunReport(payload);
      verifyHashBoundRunReport(document);
      await mkdir(this.#options.outputDirectory, {
        recursive: true,
        mode: 0o700,
      });
      const timestamp = result.startTime.toISOString()
        .replaceAll(':', '')
        .replaceAll('-', '')
        .replace('.', '');
      const outputPath = path.join(
        this.#options.outputDirectory,
        `${timestamp}-${document.contentSha256.slice(0, 16)}.json`,
      );
      const handle = await open(outputPath, 'wx', 0o600);
      try {
        await handle.writeFile(`${canonicalJson(document)}\n`, 'utf8');
        await handle.sync();
      } finally {
        await handle.close();
      }
      console.log(JSON.stringify({
        canvasResolutionE2eReport: displayPath(
          this.#options.workspaceRoot,
          outputPath,
        ),
        contentSha256: document.contentSha256,
        status: effectiveStatus,
      }));
      if (effectiveStatus !== 'passed') return {status: 'failed' as const};
      return {status: result.status};
    } catch (error) {
      console.error(`Canvas resolution hash reporter failed: ${boundedText(
        (error as Error).message,
      )}`);
      return {status: 'failed' as const};
    }
  }

  printsToStdio() {
    return false;
  }
}
