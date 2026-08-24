#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  FAMILY_LEARNING_EVENTS_V2_PRODUCTION_RELEASE_BINDINGS,
} from '../apps/web/lib/family/learning-events-v2-contract';
import {
  inspectFamilyProductionConfiguration,
} from '../apps/web/lib/family/production-readiness';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vercelConfigPath = path.join(root, 'vercel.family-portal.json');

function vercelCronContract(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const config = value as {crons?: unknown; framework?: unknown};
  if (config.framework !== 'nextjs' || !Array.isArray(config.crons)) return false;
  return config.crons.length === 1
    && config.crons[0]?.path === '/api/cron/family-notifications'
    && config.crons[0]?.schedule === '*/5 * * * *';
}

let vercelConfig: unknown;
try {
  vercelConfig = JSON.parse(await readFile(vercelConfigPath, 'utf8'));
} catch {
  vercelConfig = null;
}

const report = inspectFamilyProductionConfiguration(process.env, {
  productionReleaseBindingCount:
    FAMILY_LEARNING_EVENTS_V2_PRODUCTION_RELEASE_BINDINGS.length,
});
const output = {
  ...report,
  checks: [
    ...report.checks,
    {
      id: 'vercel-cron-contract',
      passed: vercelCronContract(vercelConfig),
      requirement: 'The opt-in Vercel profile must schedule only the bearer-protected Family maintenance route every five minutes.',
    },
  ],
};
const configurationReady = output.checks.every((check) => check.passed);

process.stdout.write(`${JSON.stringify({
  ...output,
  configurationReady,
  disposition: configurationReady
    ? 'CONFIGURATION_READY_NOT_RELEASE_APPROVED'
    : 'CONFIGURATION_NOT_READY',
  releaseApproved: false,
  secretValuesIncluded: false,
}, null, 2)}\n`);
process.exitCode = configurationReady ? 0 : 1;
