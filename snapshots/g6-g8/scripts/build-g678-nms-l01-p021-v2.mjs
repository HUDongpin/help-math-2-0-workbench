#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP021} from './lib/g678-nms-l01-p021-generator-v2.mjs';
export const ID='shared-nms002-l01-p021',CALIBRATION='g678-nms-l01-p021-current-js-v2';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p021-source-spec-v2.json", "bytes": 222352, "sha256": "23c69741abd56acde99e2513c4a48591ca84e6ab6acf5dd3eda78b541e8a195d"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/IN/L1IN11.swf", "bytes": 225642, "sha256": "0d1c2ea937365b40403eb7584b3133fd1820fb959d23cdd76e18f02fb0b8a1b1"};
export function build(options={}){return buildP021({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.slice(2).every(a=>['--check','--prepare','--staged'].includes(a)));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare'),staged:process.argv.includes('--staged')}),null,2));}
