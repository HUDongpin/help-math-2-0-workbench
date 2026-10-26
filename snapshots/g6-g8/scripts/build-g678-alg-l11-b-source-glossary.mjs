#!/usr/bin/env node
// The XML geometry/legacy term grammar implementation lives in the bound Python
// generator. This entrypoint keeps the canonical workbench CLI in Node.
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result=spawnSync('python3',['scripts/build-g678-alg-l11-b-source-glossary.py'],{cwd:root,env:process.env,stdio:'inherit'});
process.exitCode=result.status??1;
