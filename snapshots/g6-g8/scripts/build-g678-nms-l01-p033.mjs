#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP033} from './lib/g678-nms-l01-p033-generator-v1.mjs';
export const ID='shared-nms002-l01-p033',CALIBRATION='g678-nms-l01-p033-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p033-source-spec-v1.json", "bytes": 78879, "sha256": "08039731b068301b5948c3a6f7d84b49acecd2c621cde7770c5a69d53892d25b"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/TI/L1TI08.swf", "bytes": 337708, "sha256": "a8aff21f1b22bc62de728af927e685f82314eb8eced3419fff42766f3d5dcec9"};
export function build(options={}){return buildP033({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
