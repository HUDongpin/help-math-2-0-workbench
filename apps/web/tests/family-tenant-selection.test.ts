import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const webRoot = path.resolve(import.meta.dirname, '..');

test('guardian tenant selection is server-authorized and clears child scope', async () => {
  const [authorization, selection, page] = await Promise.all([
    readFile(path.join(webRoot, 'lib/family/authorization.server.ts'), 'utf8'),
    readFile(path.join(webRoot, 'lib/family/tenant-selection.server.ts'), 'utf8'),
    readFile(path.join(webRoot, 'app/[locale]/family/page.tsx'), 'utf8'),
  ]);

  assert.match(selection, /readFamilyAuthorizedTenantOptions\('guardian'\)/u);
  assert.match(
    selection,
    /tenants\.some\(\(tenant\) => tenant\.id === parsed\.data\.tenantId\)/u,
  );
  assert.match(selection, /httpOnly: true/u);
  assert.match(selection, /sameSite: 'lax'/u);
  assert.match(selection, /clearSelectedFamilyChildId\(\)/u);
  assert.match(selection, /return failure\('NOT_FOUND'\)/u);
  assert.match(
    authorization,
    /\.filter\(\(tenant\) => tenant\.roles\.includes\(role\)\)/u,
  );
  assert.match(
    authorization,
    /displayName: tenant\.displayName,\s+id: tenant\.id/u,
  );
  assert.match(page, /tenantOptions\.length > 1/u);
  assert.match(page, /selectTenantFromFamilyPortal/u);
});
test('the browser tenant selector carries no authority fields', async () => {
  const portal = await readFile(
    path.join(webRoot, 'components/family/family-portal.tsx'),
    'utf8',
  );
  const tenantSelector = portal.slice(
    portal.indexOf('family-tenant-selector'),
    portal.indexOf('family-child-selector'),
  );

  assert.match(tenantSelector, /tenant\.displayName/u);
  assert.match(tenantSelector, /tenant\.id/u);
  assert.doesNotMatch(
    tenantSelector,
    /providerSubject|environmentId|dataMode|studentId|roles/u,
  );
  assert.match(portal, /router\.refresh\(\)/u);
});
