import {expect, test, type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {ModuleKind, transpileModule} from 'typescript';

const origin = 'http://helpmath-identity.test';
async function bind(page: Page, ids: string[], candidate: {token: string; expiresAt: number} | undefined, now: number) {
  return page.evaluate(async ({ids, candidate, now}) => {
    const url = new URL('/identity.js', location.href).href;
    const {bindLearningEventIdentities} = await import(url);
    return Object.fromEntries(await bindLearningEventIdentities(ids, candidate, indexedDB, now));
  }, {ids, candidate, now});
}

test.beforeEach(async ({context}) => {
  const source = await readFile(new URL('../lib/learning-event-identity.ts', import.meta.url), 'utf8');
  const compiled = transpileModule(source, {compilerOptions: {module: ModuleKind.ESNext}}).outputText;
  await context.route(`${origin}/**`, route => route.fulfill({
    contentType: route.request().url().endsWith('/identity.js') ? 'text/javascript' : 'text/html',
    body: route.request().url().endsWith('/identity.js') ? compiled : '<!doctype html><title>Identity transaction fixture</title>',
  }));
});

test('concurrent tabs select one durable actor and preserve pinned retries across rotation', async ({page, context}) => {
  const second = await context.newPage();
  await Promise.all([page.goto(origin), second.goto(origin)]);
  const [left, right] = await Promise.all([
    bind(page, ['left'], {token: 'signed-A', expiresAt: 1000}, 0),
    bind(second, ['right'], {token: 'signed-B', expiresAt: 1000}, 0),
  ]);
  expect(left.left.token).toBe(right.right.token);
  await page.reload();
  expect((await bind(page, ['left'], undefined, 1)).left.token).toBe(left.left.token);
  await bind(page, ['queued-before-expiry'], undefined, 999);
  const rotated = await bind(second, ['queued-before-expiry', 'new'], {token: 'signed-new', expiresAt: 2000}, 1001);
  expect(rotated['queued-before-expiry'].token).toBe(left.left.token);
  expect(rotated.new.token).toBe('signed-new');
});

test('an aborted event binding transaction cannot leave a partially selected browser identity', async ({page}) => {
  await page.goto(origin);
  const rejected = await page.evaluate(async () => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'events') this.transaction.abort();
      return original.apply(this, args);
    };
    try {
      const url = new URL('/identity.js', location.href).href;
      const {bindLearningEventIdentities} = await import(url);
      await bindLearningEventIdentities(['interrupted'], {token: 'must-not-survive', expiresAt: 1000}, indexedDB, 0);
      return false;
    } catch { return true; }
    finally { IDBObjectStore.prototype.put = original; }
  });
  expect(rejected).toBe(true);
  expect(await bind(page, ['interrupted'], undefined, 1)).toEqual({});
  expect((await bind(page, ['interrupted'], {token: 'recovered', expiresAt: 1000}, 1)).interrupted.token).toBe('recovered');
});
