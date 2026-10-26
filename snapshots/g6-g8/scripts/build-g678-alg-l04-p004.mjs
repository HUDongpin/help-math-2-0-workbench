#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTerminalSourcePage} from './lib/g678-terminal-source-generator-v5.mjs';
import {compileAlgL4P004Reading} from './lib/g678-alg-l04-p004-source-reading-v1.mjs';
export {ROOT, encode, pin, sha, readBound} from './lib/g678-terminal-source-generator-v5.mjs';
export const ID='shared-alg001-l04-p004';
export const CALIBRATION='g678-alg-l04-p004-current-js-v1';
export const RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
export const SPEC=Object.freeze({path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/alg-l04-p004-source-spec-v1.json',bytes:15574,sha256:'21b9ac8ffb9000e9bd3a35c465a60fbe74f8ca336b9acfc002b18164e748da90'});
export const SOURCE=Object.freeze({path:'G6-G8-shared/ALG001/L4/RW/L4RW04.swf',bytes:826952,sha256:'552bbc4f4b5a51101ad9a029a6952963c2cc141c6ac776a92d16b234bc635ab4'});
export const build=options=>buildTerminalSourcePage({ID,CALIBRATION,SPEC,SOURCE,
 builderPath:'scripts/build-g678-alg-l04-p004.mjs',modulePath:'packages/demos/src/modules/g678-alg-l04-p004.tsx',timelinePath:'packages/demos/src/timelines/shared-alg001-l04-p004.ts',
 title:'Relationships: Real World Activity',readingCompiler:compileAlgL4P004Reading,readingCompilerPath:'scripts/lib/g678-alg-l04-p004-source-reading-v1.mjs'},options);
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(JSON.stringify(await build({check:process.argv[2]==='--check'}),null,2));
}
