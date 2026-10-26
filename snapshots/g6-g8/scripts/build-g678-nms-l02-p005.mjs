#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTerminalSourcePage} from './lib/g678-terminal-source-generator-v5.mjs';
import {compileNmsL2P005Reading} from './lib/g678-nms-l02-p005-source-reading-v1.mjs';
export {ROOT, encode, pin, sha, readBound} from './lib/g678-terminal-source-generator-v5.mjs';
export const ID='shared-nms002-l02-p005';
export const CALIBRATION='g678-nms-l02-p005-current-js-v1';
export const RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
export const SPEC=Object.freeze({path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l02-p005-source-spec-v1.json',bytes:14158,sha256:'66bb3ab8e348a75c76236cf9b44b1400ed69a7fa2d13b67805c852842179aa8c'});
export const SOURCE=Object.freeze({path:'G6-G8-shared/NMS002/L2/RW/L2RW05.swf',bytes:891150,sha256:'5062729f8c2db1fbd460b2d9fee4fdd038bc6f9b8dc02727074b9775032e6387'});
export const build=options=>buildTerminalSourcePage({ID,CALIBRATION,SPEC,SOURCE,
 builderPath:'scripts/build-g678-nms-l02-p005.mjs',modulePath:'packages/demos/src/modules/g678-nms-l02-p005.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l02-p005.ts',
 title:'Fractions, Decimals and Percent Concepts: Real World Activity',readingCompiler:compileNmsL2P005Reading,readingCompilerPath:'scripts/lib/g678-nms-l02-p005-source-reading-v1.mjs'},options);
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(JSON.stringify(await build({check:process.argv[2]==='--check'}),null,2));
}
