#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildNmsL1FollowupSourcePage} from './lib/g678-nms-l01-followup-generator-v1.mjs';
export {ROOT,pin,encode,readBound} from './lib/g678-nms-l01-followup-generator-v1.mjs';
export const ID='shared-nms002-l01-p003',CALIBRATION='g678-nms-l01-p003-source-candidate-v1';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export const SPEC={path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p003-source-spec-v1.json',bytes:33309,sha256:'5981bbb7e05895d52e24c4045402fdd87f755f5c75e49824be697ac87e487fe3'};
export const SOURCE={path:'G6-G8-shared/NMS002/L1/RW/L1RW03.swf',bytes:310459,sha256:'6486970403a56712ad47bd50f504b8a6209226517016b6fedc70bf1de481643c'};
export const builderPath='scripts/build-g678-nms-l01-p003.mjs';
export function build({check=false}={}){return buildNmsL1FollowupSourcePage({ID,CALIBRATION,SPEC,SOURCE,builderPath,modulePath:'packages/demos/src/modules/g678-nms-l01-p003.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l01-p003.ts',title:'Positive and Negative Numbers: Real World Activity'},{check});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(JSON.stringify(await build({check:process.argv.includes('--check')}),null,2));}
