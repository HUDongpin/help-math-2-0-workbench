#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTerminalSourcePage} from './lib/g678-terminal-source-generator-v4.mjs';
export {ROOT, encode, pin, sha, readBound} from './lib/g678-terminal-source-generator-v4.mjs';
export const ID = 'shared-alg001-l06-p002';
export const CALIBRATION = 'g678-alg-l06-p002-current-js-v2';
export const RUN = `work/g678-shared-page-factory/${CALIBRATION}`;
export const FREEZE = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT = FREEZE.replace(/\.json$/u, '.fragment.json');
export const SPEC = Object.freeze({path: '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/alg-l06-p002-source-spec-v2.json', bytes: 12104, sha256: '0a98b6f6101cee1123baaf19128fb528796e20d86144cb73d87ba4ee3929d24a'});
export const SOURCE = Object.freeze({path: 'G6-G8-shared/ALG001/L6/RW/L6RW02.swf', bytes: 2027783, sha256: '63126b485c23810e3d3a08d910306554cc4fe78a3713d8a0de99cd47d134bb1b'});
export const build = options => buildTerminalSourcePage({ID, CALIBRATION, SPEC, SOURCE,
  builderPath: 'scripts/build-g678-alg-l06-p002-v2.mjs', modulePath: 'packages/demos/src/modules/g678-alg-l06-p002-v2.tsx', timelinePath: 'packages/demos/src/timelines/shared-alg001-l06-p002.ts',
  title: 'Understanding Functions: Real World Activity'}, options);
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.length === 2 || process.argv.length === 3 && process.argv[2] === '--check');
  console.log(JSON.stringify(await build({check: process.argv[2] === '--check'}), null, 2));
}
