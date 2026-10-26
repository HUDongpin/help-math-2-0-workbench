#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP032} from './lib/g678-nms-l01-p032-generator-v1.mjs';
export const ID='shared-nms002-l01-p032',CALIBRATION='g678-nms-l01-p032-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p032-source-spec-v1.json", "bytes": 78039, "sha256": "06995c9274fb7a2c0bec44551952287fecd5fcfcf0f144181ac2b9b726fb6b11"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/TI/L1TI07.swf", "bytes": 859647, "sha256": "baba6b4f0d4ebaa9d014f1be2061e6e82e912bfcc1034f69bd33f78a0d570dcc"};
export function build(options={}){return buildP032({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
