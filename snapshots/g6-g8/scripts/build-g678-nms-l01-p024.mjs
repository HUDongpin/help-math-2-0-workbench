#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP024} from './lib/g678-nms-l01-p024-generator-v1.mjs';
export const ID='shared-nms002-l01-p024',CALIBRATION='g678-nms-l01-p024-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p024-source-spec-v1.json", "bytes": 195970, "sha256": "262743fb434e97534110aaf950f3825c23c914c9152da6ea5d0c02986d0ce9d0"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN14.swf", "bytes": 157428, "sha256": "c7dbf393e645c04560e0977675131109667c8094315a70321ad8af552bca038d"};
export function build(options={}){return buildP024({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
