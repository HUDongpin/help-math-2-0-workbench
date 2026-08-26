import {
  expect,
  test as base,
  type Browser,
  type BrowserContext,
  type ConsoleMessage,
  type Locator,
  type Page,
  type Request,
  type TestInfo,
} from '@playwright/test';

export {expect};
export type {Browser, BrowserContext, Locator, Page, Request};

export type SiteRuntimeIssue = Readonly<{
  consoleType: string | null;
  kind: 'console-error' | 'maximum-update-depth' | 'pageerror';
  location: Readonly<{columnNumber: number; lineNumber: number; url: string}> | null;
  message: string;
  pageUrl: string;
}>;

const MAXIMUM_UPDATE_DEPTH = 'Maximum update depth exceeded';

export function classifyConsoleIssue(
  consoleType: string,
  message: string,
): SiteRuntimeIssue['kind'] | null {
  if (message.includes(MAXIMUM_UPDATE_DEPTH)) return 'maximum-update-depth';
  if (consoleType === 'error') return 'console-error';
  return null;
}

export class SiteRuntimeIssueGate {
  readonly #attachedPages = new WeakSet<Page>();
  readonly #issues: SiteRuntimeIssue[] = [];
  readonly #pages = new Set<Page>();

  attachPage(page: Page): void {
    if (this.#attachedPages.has(page)) return;
    this.#attachedPages.add(page);
    this.#pages.add(page);

    page.on('console', (consoleMessage: ConsoleMessage) => {
      const message = consoleMessage.text();
      const consoleType = consoleMessage.type();
      const kind = classifyConsoleIssue(consoleType, message);
      if (!kind) return;
      this.#issues.push({
        consoleType,
        kind,
        location: consoleMessage.location(),
        message,
        pageUrl: page.url(),
      });
    });
    page.on('pageerror', (error) => {
      this.#issues.push({
        consoleType: null,
        kind: 'pageerror',
        location: null,
        message: error.stack ?? error.message,
        pageUrl: page.url(),
      });
    });
  }

  get issues(): readonly SiteRuntimeIssue[] {
    return this.#issues;
  }

  async drainOpenPages(): Promise<void> {
    await Promise.all([...this.#pages].map(async (page) => {
      if (page.isClosed()) return;
      await page.evaluate(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setTimeout(resolve, 0);
        }));
      })).catch(() => undefined);
    }));
  }
}

type RuntimeGateFixtures = Readonly<{
  runtimeIssueGate: SiteRuntimeIssueGate;
}>;

export const test = base.extend<RuntimeGateFixtures>({
  runtimeIssueGate: [async ({}, use, testInfo: TestInfo) => {
    const gate = new SiteRuntimeIssueGate();
    await use(gate);
    await gate.drainOpenPages();
    if (gate.issues.length === 0) return;

    await testInfo.attach('site-runtime-issues.json', {
      body: Buffer.from(`${JSON.stringify(gate.issues, null, 2)}\n`, 'utf8'),
      contentType: 'application/json',
    });
    throw new Error(
      `Site runtime gate observed ${gate.issues.length} blocking issue(s):\n`
      + JSON.stringify(gate.issues, null, 2),
    );
  }, {auto: true}],

  context: async ({context, runtimeIssueGate}, provideContext) => {
    const attachPage = (candidate: Page) => runtimeIssueGate.attachPage(candidate);
    context.on('page', attachPage);
    for (const candidate of context.pages()) runtimeIssueGate.attachPage(candidate);
    await provideContext(context);
    context.off('page', attachPage);
  },

  page: async ({page, runtimeIssueGate}, providePage) => {
    runtimeIssueGate.attachPage(page);
    await providePage(page);
  },
});
