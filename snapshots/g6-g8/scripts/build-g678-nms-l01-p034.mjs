#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP034} from './lib/g678-nms-l01-p034-generator-v1.mjs';
export const ID='shared-nms002-l01-p034',CALIBRATION='g678-nms-l01-p034-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p034-source-spec-v1.json", "bytes": 83742, "sha256": "2546b1174867b41ee8e9d9f4c8704b7758b09d75cf9991182d4d269e547a3174"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/TI/L1TI09.swf", "bytes": 960950, "sha256": "ceeb9f0693e7ddcf85642ee66f8b6e8ef7a5be8ab3d4d6d9e9b9cb4eedb87f63"};
export function build(options={}){return buildP034({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
