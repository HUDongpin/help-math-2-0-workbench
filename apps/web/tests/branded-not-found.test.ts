import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {brandedNotFoundDocument, notFoundLocaleForPath} from '../lib/not-found-copy';

// proxy.ts itself is not imported here: it loads @clerk/nextjs/server, which
// only resolves inside the Next bundler (see PR #34). The e2e suite covers the
// live 404 responses; this guards the document and that the proxy no longer rewrites.
test('branded 404 document is self-contained and localized', () => {
  for (const [locale, title, home] of [['en', 'Page not found', '/'], ['es', 'Página no encontrada', '/es']] as const) {
    const body = brandedNotFoundDocument(locale);
    assert.match(body, new RegExp(`<html lang="${locale}">`, 'u'));
    assert.match(body, new RegExp(`<h1>${title}</h1>`, 'u'));
    assert.match(body, new RegExp(`href="${home}"`, 'u'));
    assert.match(body, /noindex, nofollow/u);
    assert.doesNotMatch(body, /<script/u);
  }
});

test('locale detection', () => {
  assert.equal(notFoundLocaleForPath('/es'), 'es');
  assert.equal(notFoundLocaleForPath('/es/courses/6/1'), 'es');
  assert.equal(notFoundLocaleForPath('/essay'), 'en');
  assert.equal(notFoundLocaleForPath('/courses/6/1'), 'en');
});

test('proxy answers denied paths directly instead of rewriting into the app', () => {
  const source = readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8');
  const fn = source.slice(source.indexOf('function brandedNotFoundResponse'), source.indexOf('function isReferencePath'));
  assert.match(fn, /brandedNotFoundDocument/u);
  assert.doesNotMatch(fn, /NextResponse\.rewrite/u);
});
