#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTerminalSourcePage} from './lib/g678-terminal-source-generator-v3.mjs';
export {ROOT, encode, pin, sha, readBound} from './lib/g678-terminal-source-generator-v3.mjs';
export const ID = 'shared-alg001-l02-p005';
export const CALIBRATION = 'g678-alg-l02-p005-current-js-v1';
export const RUN = `work/g678-shared-page-factory/${CALIBRATION}`;
export const FREEZE = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT = FREEZE.replace(/\.json$/u, '.fragment.json');
export const SPEC = Object.freeze({path: '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/alg-l02-p005-source-spec-v1.json', bytes: 8046, sha256: 'a9c3041e0f72b6fc405fef1e47dbc8eb001878accd47cefd8d6a3a18f9d886c6'});
export const SOURCE = Object.freeze({path: 'G6-G8-shared/ALG001/L2/RW/L2RW05.swf', bytes: 1505212, sha256: 'bd348eb929f4b35b2f4ebe83c174313e0962b86aab9cd9c9eade232be0c69252'});
export const build = options => buildTerminalSourcePage({ID, CALIBRATION, SPEC, SOURCE,
  builderPath: 'scripts/build-g678-alg-l02-p005.mjs', modulePath: 'packages/demos/src/modules/g678-alg-l02-p005.tsx', timelinePath: 'packages/demos/src/timelines/shared-alg001-l02-p005.ts',
  title: 'Variables: Real World Activity'}, options);
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.length === 2 || process.argv.length === 3 && process.argv[2] === '--check');
  console.log(JSON.stringify(await build({check: process.argv[2] === '--check'}), null, 2));
}
