#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTerminalSourcePage} from './lib/g678-terminal-source-generator-v1.mjs';
export {ROOT, encode, pin, sha, readBound} from './lib/g678-terminal-source-generator-v1.mjs';
export const ID = 'shared-alg001-l01-p006';
export const CALIBRATION = 'g678-alg-l01-p006-current-js-v1';
export const RUN = `work/g678-shared-page-factory/${CALIBRATION}`;
export const FREEZE = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT = FREEZE.replace(/\.json$/u, '.fragment.json');
export const SPEC = Object.freeze({path: '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/alg-l01-p006-source-spec-v1.json', bytes: 7930, sha256: 'cdacad1d61ffc3c459260732a01f03f6842b2e6e63c663390019ebd7fb93bd9e'});
export const SOURCE = Object.freeze({path: 'G6-G8-shared/ALG001/L1/RW/L1RW06.swf', bytes: 1458326, sha256: '0a5f2ba7b1311ed961509a7ac4ab0af01a56c392e4c9786072a07543c29c8868'});
export const build = options => buildTerminalSourcePage({ID, CALIBRATION, SPEC, SOURCE,
  builderPath: 'scripts/build-g678-alg-l01-p006.mjs', modulePath: 'packages/demos/src/modules/g678-alg-l01-p006.tsx',
  title: 'Interpreting Graphs: Real World Activity'}, options);
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.length === 2 || process.argv.length === 3 && process.argv[2] === '--check');
  console.log(JSON.stringify(await build({check: process.argv[2] === '--check'}), null, 2));
}
