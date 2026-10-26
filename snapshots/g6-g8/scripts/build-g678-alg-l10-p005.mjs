#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTerminalSourcePage} from './lib/g678-terminal-source-generator-v6.mjs';
import {compileAlgL10Reading} from './lib/g678-alg-l10-source-reading-v1.mjs';
export {ROOT, encode, pin, sha, readBound} from './lib/g678-terminal-source-generator-v6.mjs';
export const ID='shared-alg001-l10-p005';
export const CALIBRATION='g678-alg-l10-p005-source-candidate-v1';
export const RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
export const SPEC=Object.freeze({path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/alg-l10-p005-source-spec-v1.json',bytes:37484,sha256:'3008f159727f07df1690c04d4fa4bbf91da917b8e953eb918f4ebe719e770101'});
export const SOURCE=Object.freeze({path:'G6-G8-shared/ALG001/L10/RW/L10RW05.swf',bytes:430730,sha256:'fb1e8707652f7eec02443c63a4ce4e068642cbc91e222d2b19a02acdcbde23e7'});
export const build=options=>buildTerminalSourcePage({ID,CALIBRATION,SPEC,SOURCE,
 builderPath:'scripts/build-g678-alg-l10-p005.mjs',modulePath:'packages/demos/src/modules/g678-alg-l10-p005.tsx',timelinePath:'packages/demos/src/timelines/shared-alg001-l10-p005.ts',
 title:'Algebraic Expressions Involving Powers: Real World Activity',readingCompiler:compileAlgL10Reading,readingCompilerPath:'scripts/lib/g678-alg-l10-source-reading-v1.mjs'},options);
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(JSON.stringify(await build({check:process.argv[2]==='--check'}),null,2));
}
