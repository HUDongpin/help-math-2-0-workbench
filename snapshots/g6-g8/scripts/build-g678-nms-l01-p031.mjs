#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildP031} from './lib/g678-nms-l01-p031-generator-v1.mjs';
export const ID='shared-nms002-l01-p031',CALIBRATION='g678-nms-l01-p031-current-js-v1';
export const SPEC={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p031-source-spec-v1.json", "bytes": 107063, "sha256": "1fba77f9dfdaf92c816e12bb41f01d09fd3f31ce7b1da62f8398cdc943d72be7"};
export const SOURCE={"path": "G6-G8-shared/NMS002/L1/TI/L1TI06.swf", "bytes": 385362, "sha256": "3ac14a522b818900e75c202e149d29e613844b61b68edb2b2d4cc82c7051a77e"};
export function build(options={}){return buildP031({ID,CALIBRATION,SPEC,SOURCE},options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&['--check','--prepare'].includes(process.argv[2]));console.log(JSON.stringify(await build({check:process.argv.includes('--check'),prepare:process.argv.includes('--prepare')}),null,2));}
