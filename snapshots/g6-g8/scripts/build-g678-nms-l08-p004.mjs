#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTerminalSourcePage} from './lib/g678-terminal-source-generator-v5.mjs';
import {compileNmsL8P004Reading} from './lib/g678-nms-l08-p004-source-reading-v1.mjs';
export {ROOT, encode, pin, sha, readBound} from './lib/g678-terminal-source-generator-v5.mjs';
export const ID='shared-nms002-l08-p004';
export const CALIBRATION='g678-nms-l08-p004-current-js-v1';
export const RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
export const SPEC=Object.freeze({path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l08-p004-source-spec-v1.json',bytes:16214,sha256:'5923620a0cbb6aab3ab37e25925e886add60376f6e98351b3e1c3741cb3a7ca0'});
export const SOURCE=Object.freeze({path:'G6-G8-shared/NMS002/L8/RW/L8RW04.swf',bytes:1120866,sha256:'b13f1123d02706e075da4ce45063309dbb86a6037ddaacfb75b9d27510b9532f'});
export const build=options=>buildTerminalSourcePage({ID,CALIBRATION,SPEC,SOURCE,
 builderPath:'scripts/build-g678-nms-l08-p004.mjs',modulePath:'packages/demos/src/modules/g678-nms-l08-p004.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l08-p004.ts',
 title:'Using Exponents & Scientific Notation: Real World Activity',readingCompiler:compileNmsL8P004Reading,readingCompilerPath:'scripts/lib/g678-nms-l08-p004-source-reading-v1.mjs'},options);
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(JSON.stringify(await build({check:process.argv[2]==='--check'}),null,2));
}
