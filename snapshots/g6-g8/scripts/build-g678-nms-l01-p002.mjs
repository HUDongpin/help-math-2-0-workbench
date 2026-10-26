#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildNmsL1P002SourcePage} from './lib/g678-nms-l01-p002-generator-v1.mjs';
export const ID='shared-nms002-l01-p002';
export const CALIBRATION='g678-nms-l01-p002-current-js-v1';
export const SPEC={path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p002-source-spec-v1.json',bytes:20207,sha256:'1ee360ed2859b43485e70524e12951113a457a8fa8db084742e2d783a5d24a57'};
export const SOURCE={path:'G6-G8-shared/NMS002/L1/RW/L1RW02.swf',bytes:2318610,sha256:'8a7ecf75e3dc95dc4e9d7a35b52b97df02f5e93f5f7fa1e22b8e4472fe4fd6c4'};
export const builderPath='scripts/build-g678-nms-l01-p002.mjs';
export function build({check=false}={}){return buildNmsL1P002SourcePage({ID,CALIBRATION,SPEC,SOURCE,builderPath,modulePath:'packages/demos/src/modules/g678-nms-l01-p002.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l01-p002.ts',title:'Positive and Negative Numbers: Real World Activity'},{check});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(JSON.stringify(await build({check:process.argv.includes('--check')}),null,2));}
