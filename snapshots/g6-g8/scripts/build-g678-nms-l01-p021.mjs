#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP021} from './lib/g678-nms-l01-p021-generator-v1.mjs';
export const ID='shared-nms002-l01-p021',CALIBRATION='g678-nms-l01-p021-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p021-source-spec-v1.json", "bytes": 216739, "sha256": "e3462ab4db25be1526a7eeeb8525fed8182917f53849b8f247c5a384af4f842a"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN11.swf", "bytes": 225642, "sha256": "0d1c2ea937365b40403eb7584b3133fd1820fb959d23cdd76e18f02fb0b8a1b1"};
export function build(options={}){return buildP021({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
