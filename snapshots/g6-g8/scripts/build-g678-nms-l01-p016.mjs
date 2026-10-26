#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP016} from './lib/g678-nms-l01-p016-generator-v1.mjs';
export const ID='shared-nms002-l01-p016',CALIBRATION='g678-nms-l01-p016-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p016-source-spec-v1.json", "bytes": 117650, "sha256": "0ff821390bcfc10cf973b2a3a8933f63d0fc69e2fb1a806dd142aa207a6168a2"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN06.swf", "bytes": 747595, "sha256": "1e283560185a227c44498b8d0a77790323f0b006dfa0c4aadb7fe07bc8f757c6"};
export function build(options={}){return buildP016({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
