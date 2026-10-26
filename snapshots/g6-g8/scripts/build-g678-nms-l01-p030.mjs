#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP030} from './lib/g678-nms-l01-p030-generator-v1.mjs';
export const ID='shared-nms002-l01-p030',CALIBRATION='g678-nms-l01-p030-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p030-source-spec-v1.json", "bytes": 120909, "sha256": "5c4246e5c4c8b6cae0bce502d71313d3bd80a4c19b7e8e92f398d992bf114824"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/TI/L1TI05.swf", "bytes": 186893, "sha256": "6a0083957bff3132bf4c1d573d21bbc18eabfcd9ad458efd20baa59a560405cc"};
export function build(options={}){return buildP030({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
