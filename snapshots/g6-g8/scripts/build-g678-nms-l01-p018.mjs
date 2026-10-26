#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP018} from './lib/g678-nms-l01-p018-generator-v1.mjs';
export const ID='shared-nms002-l01-p018',CALIBRATION='g678-nms-l01-p018-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p018-source-spec-v1.json", "bytes": 89684, "sha256": "f96c77123157c8f9d6cd95e019904747d341c40054db7b09bc4fb40c0b34ad66"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN08.swf", "bytes": 196253, "sha256": "42109c2d4317b6e1b0af3519a00549344329d6a2266210d2cdd997c17d63bd7d"};
export function build(options={}){return buildP018({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
