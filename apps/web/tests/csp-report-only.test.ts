import assert from 'node:assert/strict';
import test from 'node:test';

import {NextRequest} from 'next/server';

import nextConfig from '../next.config';
import {
  CSP_REPORT_PATH,
  EMBEDDED_COURSE_ADAPTER_REPORT_ONLY_CSP,
  pageReportOnlyCsp,
} from '../lib/csp-report-only';
import {
  createCspReportBudget,
  parseCspReports,
  redactBlocked,
  redactPath,
} from '../lib/csp-report.server';
import {proxyForRequest} from '../proxy';
import {POST} from '../app/api/csp-report/route';

const nonceOf = (policy: string) => /'nonce-([^']+)'/u.exec(policy)?.[1];

test('document requests get a fresh nonce in a Report-Only header, forwarded to Next.js', async () => {
  const first = await proxyForRequest(new NextRequest('https://www.helpmath.ai/en'));
  const second = await proxyForRequest(new NextRequest('https://www.helpmath.ai/'));
  const a = first.headers.get('content-security-policy-report-only')!;
  const b = second.headers.get('content-security-policy-report-only')!;
  assert.ok(nonceOf(a) && nonceOf(b));
  assert.notEqual(nonceOf(a), nonceOf(b));
  assert.match(a, /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/u);
  assert.match(a, new RegExp(`report-uri ${CSP_REPORT_PATH}`, 'u'));
  assert.doesNotMatch(a.split(';').find((d) => d.trim().startsWith('script-src'))!, /unsafe-inline/u);
  // Next.js reads the nonce from the forwarded request header.
  assert.equal(first.headers.get('x-middleware-request-content-security-policy-report-only'), a);
  assert.equal(second.headers.get('x-middleware-request-content-security-policy-report-only'), b);
  // The proxy never sets an enforced CSP.
  assert.equal(first.headers.get('content-security-policy'), null);
});

test('asset requests do not get a page nonce policy', async () => {
  const response = await proxyForRequest(new NextRequest('https://www.helpmath.ai/flash-assets/missing.svg'));
  assert.equal(response.headers.get('content-security-policy-report-only'), null);
});

test('the enforced CSPs are unchanged and the probes sit beside them', async () => {
  const rules = await nextConfig.headers!();
  const all = rules.flatMap((rule) => rule.headers.map((h) => ({source: rule.source, ...h})));
  const enforced = all.filter((h) => h.key === 'Content-Security-Policy');
  assert.equal(enforced.length >= 2, true);
  for (const h of enforced) {
    assert.doesNotMatch(h.value, /nonce-|report-uri|report-to/u);
    assert.match(h.value, /script-src 'self' 'unsafe-inline'/u);
  }
  const adapter = all.find((h) => h.source === '/flash-assets/courses/:path*' && h.key === 'Content-Security-Policy-Report-Only');
  assert.equal(adapter?.value, EMBEDDED_COURSE_ADAPTER_REPORT_ONLY_CSP);
  assert.match(EMBEDDED_COURSE_ADAPTER_REPORT_ONLY_CSP, /script-src 'self'; /u);
  assert.ok(all.some((h) => h.key === 'Reporting-Endpoints' && h.value.includes(CSP_REPORT_PATH)));
});

test('production page probe omits eval allowances', () => {
  assert.doesNotMatch(pageReportOnlyCsp('n', true), /unsafe-eval/u);
  assert.match(pageReportOnlyCsp('n', false), /unsafe-eval/u);
});

test('reports are redacted: origin only, path only, no samples', () => {
  assert.equal(redactBlocked('https://evil.example/x.js?token=1'), 'https://evil.example');
  assert.equal(redactBlocked('inline'), 'inline');
  assert.equal(redactPath('https://www.helpmath.ai/en/courses/3/2?email=a@b.c#x'), '/en/courses/3/2');
  const [legacy] = parseCspReports({'csp-report': {
    'document-uri': 'https://www.helpmath.ai/es?name=kid',
    'violated-directive': 'script-src-elem',
    'effective-directive': 'script-src-elem',
    'blocked-uri': 'inline',
    'script-sample': 'alert("secret")',
    'line-number': 3,
  }});
  assert.deepEqual(legacy, {directive: 'script-src-elem', blocked: 'inline', documentPath: '/es', sourcePath: null, line: 3, disposition: 'report'});
  const modern = parseCspReports([{type: 'csp-violation', user_agent: 'UA', body: {documentURL: 'https://www.helpmath.ai/', effectiveDirective: 'img-src', blockedURL: 'https://cdn.example/a.png', sample: 'x', disposition: 'report'}}, {type: 'deprecation', body: {}}]);
  assert.equal(modern.length, 1);
  assert.equal(JSON.stringify(modern).includes('UA'), false);
  assert.equal(JSON.stringify(legacy).includes('secret'), false);
});

test('budget is global per instance and resets each minute', () => {
  let now = 0;
  const budget = createCspReportBudget(3, () => now);
  assert.equal(budget(2), 2);
  assert.equal(budget(5), 1);
  assert.equal(budget(1), 0);
  now = 60_000;
  assert.equal(budget(1), 1);
});

test('report route logs redacted lines and rejects bad input', async () => {
  const logged: string[] = [];
  const original = console.info;
  console.info = (line: string) => logged.push(line);
  try {
    const ok = await POST(new Request('https://www.helpmath.ai/api/csp-report', {
      method: 'POST',
      headers: {'content-type': 'application/csp-report'},
      body: JSON.stringify({'csp-report': {'document-uri': 'https://www.helpmath.ai/en?q=1', 'effective-directive': 'script-src', 'blocked-uri': 'inline'}}),
    }));
    assert.equal(ok.status, 204);
    assert.equal(logged.length, 1);
    assert.match(logged[0]!, /^csp-report-only \{"directive":"script-src","blocked":"inline","documentPath":"\/en"/u);
    assert.equal((await POST(new Request('https://x/api/csp-report', {method: 'POST', headers: {'content-type': 'text/plain'}, body: '{}'}))).status, 415);
    assert.equal((await POST(new Request('https://x/api/csp-report', {method: 'POST', headers: {'content-type': 'application/json'}, body: '{'}))).status, 400);
    assert.equal((await POST(new Request('https://x/api/csp-report', {method: 'POST', headers: {'content-type': 'application/json'}, body: 'x'.repeat(17_000)}))).status, 413);
  } finally {
    console.info = original;
  }
});
