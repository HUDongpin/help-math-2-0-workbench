#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP035} from './lib/g678-nms-l01-p035-generator-v1.mjs';
export const ID='shared-nms002-l01-p035',CALIBRATION='g678-nms-l01-p035-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p035-source-spec-v1.json", "bytes": 93615, "sha256": "6cbce35c123dcb38ab63a317d41e299160f6f9593b1eb236c84c3dcfeb529bcc"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/TI/L1TI10.swf", "bytes": 382420, "sha256": "f782359938a02658c23fdfb1b81fee008046a9a56afc3e7c62879870c7d40192"};
export function build(options={}){return buildP035({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
