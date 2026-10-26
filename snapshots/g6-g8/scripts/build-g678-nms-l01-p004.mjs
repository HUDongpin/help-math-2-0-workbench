#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildNmsL1FollowupSourcePage} from './lib/g678-nms-l01-followup-generator-v1.mjs';
export {ROOT,pin,encode,readBound} from './lib/g678-nms-l01-followup-generator-v1.mjs';
export const ID='shared-nms002-l01-p004',CALIBRATION='g678-nms-l01-p004-source-candidate-v1';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export const SPEC={path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p004-source-spec-v1.json',bytes:12210,sha256:'0a826ce9ae508568f3cda6d61a0c17b0e9ebcc09b079b3d6c741c1721b403092'};
export const SOURCE={path:'G6-G8-shared/NMS002/L1/RW/L1RW04.swf',bytes:1015332,sha256:'3c35af96419daf09d110ed722a861248dd10d57677135c4ef23f0b4b28249c1d'};
export const builderPath='scripts/build-g678-nms-l01-p004.mjs';
export function build({check=false}={}){return buildNmsL1FollowupSourcePage({ID,CALIBRATION,SPEC,SOURCE,builderPath,modulePath:'packages/demos/src/modules/g678-nms-l01-p004.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l01-p004.ts',title:'Positive and Negative Numbers: Real World Activity'},{check});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(JSON.stringify(await build({check:process.argv.includes('--check')}),null,2));}
