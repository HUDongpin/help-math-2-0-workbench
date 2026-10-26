#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP028} from './lib/g678-nms-l01-p028-generator-v1.mjs';
export const ID='shared-nms002-l01-p028',CALIBRATION='g678-nms-l01-p028-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p028-source-spec-v1.json", "bytes": 100709, "sha256": "7dc15476d3877c783463ac1c91164719120b697bf1b8a1dccefd5b4b11dbdae9"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/TI/L1TI03.swf", "bytes": 101975, "sha256": "1309c39e9a0bc69561132a8e0bd8ec605ceee7decaba250bddf44951c0a15799"};
export function build(options={}){return buildP028({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
