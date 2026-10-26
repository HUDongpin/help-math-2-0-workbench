import {buildP045} from './lib/g678-nms-l01-p045-generator-v1.mjs';
const OPTIONS = {"ID": "shared-nms002-l01-p045", "CALIBRATION": "g678-nms-l01-p045-current-js-v1", "SPEC": {"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p045-source-spec-v1.json", "bytes": 114720, "sha256": "7f2870d8c5b512f5386d032503d081fb19fee3367ed200c6bbd8270ecff2af83"}, "SOURCE": {"path": "G6-G8-shared/NMS002/L1/TS/L1TS09.swf", "bytes": 541218, "sha256": "dce152af93c1bb221d02f1c09fd7265a3ebde88f47d0e39381d6f978bc3e1651"}};
const flags = process.argv.slice(2);
if(flags.some(f=>!['--check','--prepare'].includes(f)))throw Error('unsupported P045 build flag');
console.log(JSON.stringify(await buildP045(OPTIONS,{check:flags.includes('--check'),prepare:flags.includes('--prepare')}),null,2));
