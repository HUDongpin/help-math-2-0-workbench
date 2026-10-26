#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildNmsL1P010SourcePage} from './lib/g678-nms-l01-p010-generator-v1.mjs';
export const ID='shared-nms002-l01-p010',CALIBRATION='g678-nms-l01-p010-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p010-source-spec-v1.json", "bytes": 34652, "sha256": "acc0207a982c9dfde8d9d1fe3c1abce58b33ac15ac2de3e9d8bbb1375248e48d"};
export const SOURCE={path:'G6-G8-shared/NMS002/L1/VB/L1VB06.swf',bytes:112418,sha256:'a83b82a60a68ef3bbe03af6defa18a34b8751318845ae40f2507b6af96900bba'};
export function build(options={}){return buildNmsL1P010SourcePage({ID,CALIBRATION,SPEC,SOURCE,builderPath:'scripts/build-g678-nms-l01-p010.mjs',modulePath:'packages/demos/src/modules/g678-nms-l01-p010.tsx',timelinePath:'packages/demos/src/timelines/shared-nms002-l01-p010.ts',title:'Absolute Value'},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepareOnly:process.argv.includes('--prepare')}),null,2));}
