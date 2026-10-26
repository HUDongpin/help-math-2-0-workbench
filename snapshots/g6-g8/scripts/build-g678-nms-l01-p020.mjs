#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP020} from './lib/g678-nms-l01-p020-generator-v1.mjs';
export const ID='shared-nms002-l01-p020',CALIBRATION='g678-nms-l01-p020-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p020-source-spec-v1.json", "bytes": 114690, "sha256": "e46a79842379fb30458a5f94272d6e494ea511857a37575f25b79f5e6524d6ec"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN10.swf", "bytes": 175044, "sha256": "03af79673e7b4cc21b2d9fce30ac856234e32a565c1fd15eed2816ad05753952"};
export function build(options={}){return buildP020({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
