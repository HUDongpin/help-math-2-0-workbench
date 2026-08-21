import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isMigrationStatusAvailable,
  isMigrationStatusDesignerViewRequested,
} from '../lib/migration-status-access';

test('migration status remains local by default and requires an exact production opt-in', () => {
  assert.equal(isMigrationStatusAvailable({NODE_ENV: 'development'}), true);
  assert.equal(isMigrationStatusAvailable({NODE_ENV: 'test'}), true);
  assert.equal(isMigrationStatusAvailable({NODE_ENV: 'production'}), false);
  assert.equal(isMigrationStatusAvailable({
    NODE_ENV: 'production',
    MIGRATION_STATUS_ENABLED: 'true',
  }), false);
  assert.equal(isMigrationStatusAvailable({
    NODE_ENV: 'production',
    MIGRATION_STATUS_ENABLED: '1',
  }), true);
});

test('migration status designer view requires the exact first query value', () => {
  assert.equal(isMigrationStatusDesignerViewRequested('designer'), true);
  assert.equal(isMigrationStatusDesignerViewRequested(['designer']), true);
  assert.equal(isMigrationStatusDesignerViewRequested(['designer', 'learner']), false);
  assert.equal(isMigrationStatusDesignerViewRequested(undefined), false);
  assert.equal(isMigrationStatusDesignerViewRequested(null), false);
  assert.equal(isMigrationStatusDesignerViewRequested('Designer'), false);
  assert.equal(isMigrationStatusDesignerViewRequested('true'), false);
  assert.equal(isMigrationStatusDesignerViewRequested(['learner', 'designer']), false);
});
