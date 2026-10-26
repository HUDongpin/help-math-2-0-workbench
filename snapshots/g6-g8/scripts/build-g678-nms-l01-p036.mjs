#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP036} from './lib/g678-nms-l01-p036-generator-v1.mjs';
export const ID='shared-nms002-l01-p036',CALIBRATION='g678-nms-l01-p036-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p036-source-spec-v1.json", "bytes": 121813, "sha256": "d3340eab4bc9c19fe56a1c4fd30b3682dadf4d1016f3a6be9895e4e7202c9c7d"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/TI/L1TI11.swf", "bytes": 267104, "sha256": "fc98e2133c350dcdd464a499239ae7a544e215a210866821130de065518955b9"};
export function build(options={}){return buildP036({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
