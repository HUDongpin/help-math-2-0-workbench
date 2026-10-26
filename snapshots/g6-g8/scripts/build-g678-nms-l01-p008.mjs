#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildNmsL1P008SourcePage} from './lib/g678-nms-l01-p008-generator-v1.mjs';
export const ID='shared-nms002-l01-p008',CALIBRATION='g678-nms-l01-p008-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p008-source-spec-v1.json", "bytes": 48524, "sha256": "b555fdb19f6dfd05d196cfd84a9888effbc0981ff3da7eead6312bde5faace08"};
export const SOURCE={path:'G6-G8-shared/NMS002/L1/VB/L1VB04.swf',bytes:120274,sha256:'3b884c604b246adcaf8b38a943d00093cdd26a239a5b0bac62f66230b1fc4d4a'};
export function build(options={}){return buildNmsL1P008SourcePage({ID,CALIBRATION,SPEC,SOURCE,builderPath:'scripts/build-g678-nms-l01-p008.mjs',modulePath:'packages/demos/src/modules/g678-nms-l01-p008.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l01-p008.ts',title:'Opposite Integers'},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepareOnly:process.argv.includes('--prepare')}),null,2));}
