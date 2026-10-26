#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP007} from './lib/g678-nms-l01-p007-generator-v1.mjs';
export const ID='shared-nms002-l01-p007',CALIBRATION='g678-nms-l01-p007-current-js-v1';
export const SPEC={path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p007-source-spec-v1.json',bytes:56198,sha256:'505ed7e0d516c1e0bd65d8e6ef13bd95a9cfdf3510c5ac4ef39cea7887f973ac'};
export const SOURCE={path:'G6-G8-shared/NMS002/L1/VB/L1VB03.swf',bytes:115059,sha256:'d6af65fff8de6958b8125fb45516df0f70ebc71c8e60ff8cd31efe138f27365c'};
export function build(options={}){return buildP007({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
