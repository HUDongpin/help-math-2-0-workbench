#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTerminalSourcePage} from './lib/g678-terminal-source-generator-v6.mjs';
import {compileAlgL10Reading} from './lib/g678-alg-l10-source-reading-v1.mjs';
export {ROOT, encode, pin, sha, readBound} from './lib/g678-terminal-source-generator-v6.mjs';
export const ID='shared-alg001-l10-p006';
export const CALIBRATION='g678-alg-l10-p006-source-candidate-v1';
export const RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
export const SPEC=Object.freeze({path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/alg-l10-p006-source-spec-v1.json',bytes:25683,sha256:'f0edc9c91eaa02785c2a47b84bb42e255191fa639f4c8c7b1785961c10e14427'});
export const SOURCE=Object.freeze({path:'G6-G8-shared/ALG001/L10/RW/L10RW06.swf',bytes:409478,sha256:'3843394c1ebfd124c72fb191e71a5568fe6673db2d8250f32ac0b1f74667c0fa'});
export const build=options=>buildTerminalSourcePage({ID,CALIBRATION,SPEC,SOURCE,
 builderPath:'scripts/build-g678-alg-l10-p006.mjs',modulePath:'packages/demos/src/modules/g678-alg-l10-p006.tsx',timelinePath:'packages/demos/src/timelines/shared-alg001-l10-p006.ts',
 title:'Algebraic Expressions Involving Powers: Real World Activity',readingCompiler:compileAlgL10Reading,readingCompilerPath:'scripts/lib/g678-alg-l10-source-reading-v1.mjs'},options);
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(JSON.stringify(await build({check:process.argv[2]==='--check'}),null,2));
}
