#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP027} from './lib/g678-nms-l01-p027-generator-v1.mjs';
export const ID='shared-nms002-l01-p027',CALIBRATION='g678-nms-l01-p027-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p027-source-spec-v2.json", "bytes": 1058681, "sha256": "d4efa289fce17be69dc9fb61ff2280bac5f3a249c589949d594753247bd270d0"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/TI/L1TI02.swf", "bytes": 618675, "sha256": "dc386a58be9dabe0d3a6eabed5664551cfa35d6f10d17bcf95a94ba4c01a09d0"};
export function build(options={}){return buildP027({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
