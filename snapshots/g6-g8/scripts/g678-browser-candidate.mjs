#!/usr/bin/env node
/** freeze <plan.json> <output.json> | run <candidate.json> <receipt.json> -- <command> [args] */
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin} from '../lib/g678-admission-proof.mjs';
import {freezeStableBrowserCandidate,runStableBrowser} from './lib/g678-stable-browser-candidate-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [action,input,output,...argv]=process.argv.slice(2);
if(action==='freeze') {
 const plan=readJsonPin(root,pinFile(root,input));
 const pin=freezeStableBrowserCandidate({root,animationIds:plan.animationIds,inputScope:plan.inputScope,
  extraFiles:[input,'scripts/g678-browser-candidate.mjs','scripts/lib/g678-stable-browser-candidate-v1.mjs',
   'scripts/lib/g678-browser-proof-selection-v1.mjs',...(plan.extraFiles??[])],output});
 console.log(JSON.stringify({status:'browser-candidate-frozen',candidate:pin}));
} else if(action==='run') {
 assert(argv[0]==='--'&&argv.length>1,'run requires explicit command after --');
 console.log(JSON.stringify(await runStableBrowser({root,candidatePin:pinFile(root,input),receipt:output,command:argv[1],args:argv.slice(2)})));
} else throw Error('Use freeze <plan> <output> | run <candidate> <receipt> -- <command> [args]');
