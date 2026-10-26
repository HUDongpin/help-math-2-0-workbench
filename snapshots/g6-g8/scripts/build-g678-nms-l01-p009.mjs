#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP009} from './lib/g678-nms-l01-p009-generator-v1.mjs';
export const ID='shared-nms002-l01-p009',CALIBRATION='g678-nms-l01-p009-current-js-v1';
export const SPEC={path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p009-source-spec-v2.json',bytes:69135,sha256:'3ee1c0274c82f9802faf2db7a87af4b8ed670d11c8a28c6d1bf5eaaf495e1464'};
export const SOURCE={path:'G6-G8-shared/NMS002/L1/VB/L1VB05.swf',bytes:127272,sha256:'3e57085f55dbfc6aad9e4054c4ce734e59384a3ad6e72d61f0fd5c3311f41674'};
export function build(options={}){return buildP009({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
