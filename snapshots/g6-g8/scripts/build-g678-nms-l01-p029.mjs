#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP029} from './lib/g678-nms-l01-p029-generator-v1.mjs';
export const ID='shared-nms002-l01-p029',CALIBRATION='g678-nms-l01-p029-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p029-source-spec-v1.json", "bytes": 131937, "sha256": "501d3c29879e53e881d28b37f59058d503e6bf6010da43c3957b89808b1208fb"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/TI/L1TI04.swf", "bytes": 1197719, "sha256": "1570b465737d854cc5ecf2bf294e5ae87675b428d7b7c132b6b85e405704d048"};
export function build(options={}){return buildP029({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
