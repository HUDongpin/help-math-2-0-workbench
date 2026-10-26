#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP013} from './lib/g678-nms-l01-p013-generator-v1.mjs';
export const ID='shared-nms002-l01-p013',CALIBRATION='g678-nms-l01-p013-current-js-v1';
export const SPEC={"path":"/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p013-source-spec-v1.json","bytes":91158,"sha256":"7da2519aa4a96135bde714f5ca2fbec2f409e8a510a39e0685a5991a7e9f7b10"};
export const SOURCE={"path":"G6-G8-shared/NMS002/L1/IN/L1IN03.swf","bytes":122668,"sha256":"3be54c99a5fdad5aa5e31dd736039d5b4bdc00980a793c317f8ae9543d5ddfcb"};
export function build(options={}){return buildP013({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
