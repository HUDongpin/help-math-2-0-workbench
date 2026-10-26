#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildNmsL1P005SourcePage} from './lib/g678-nms-l01-p005-generator-v1.mjs';
export {ROOT,pin,encode,readBound} from './lib/g678-nms-l01-p005-generator-v1.mjs';
export const ID='shared-nms002-l01-p005',CALIBRATION='g678-nms-l01-p005-current-js-v1';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export const SPEC={path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p005-source-spec-v1.json',bytes:24226,sha256:'89435d4781d19d3dfc904845362149d513faaa3c2fe451007caea015d77100b5'};
export const SOURCE={path:'G6-G8-shared/NMS002/L1/RW/L1RW05.swf',bytes:439673,sha256:'5d0e187e0cc14e32b819c25e0b37539eb819acd99f18df4db1abb7463d564d94'};
export const builderPath='scripts/build-g678-nms-l01-p005.mjs';
export function build({check=false}={}){return buildNmsL1P005SourcePage({ID,CALIBRATION,SPEC,SOURCE,builderPath,modulePath:'packages/demos/src/modules/g678-nms-l01-p005.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l01-p005.ts',title:'Positive and Negative Numbers: Real World Activity'},{check});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(JSON.stringify(await build({check:process.argv.includes('--check')}),null,2));}
