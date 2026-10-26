#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP022} from './lib/g678-nms-l01-p022-generator-v1.mjs';
export const ID='shared-nms002-l01-p022',CALIBRATION='g678-nms-l01-p022-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p022-source-spec-v1.json", "bytes": 144418, "sha256": "96c6ed3838f7ccd8deceb57dac3be6cd03245d649c2bfc5f3b3ba061af2d12c0"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN12.swf", "bytes": 1232694, "sha256": "0c634b34f16b55f42d954dec64f1aa353b22053d93ab6137cadf48e7cc3bb5e2"};
export function build(options={}){return buildP022({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
