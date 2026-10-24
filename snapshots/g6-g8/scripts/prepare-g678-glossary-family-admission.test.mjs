import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readRegistryTransaction} from '../lib/g678-admission-proof.mjs';
import {FAMILY_CONFIG_PATH} from '../lib/g678-glossary-family-admission.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {verifyGlobalReadDisposition} from './prepare-g678-glossary-family-admission.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(fs.readFileSync(path.join(root,FAMILY_CONFIG_PATH)));

test('P015 --prepare rejects a pending S disposition independent of current candidate state',()=>{
  const pending=structuredClone(config);
  pending.globalReadDisposition={status:'pending',evidence:null};
  assert.throws(()=>verifyGlobalReadDisposition(root,pending),/global S-read disposition is pending/);
});

test('actual private registry validator accepts the exact canonical runtime projection',()=>{
  const id=config.animationId;
  const entry={key:id,module:`./modules/${id}`,maturity:'private-current-js',
    complexityLane:'interactive-understood',artifacts:{
      module:pinFile(root,`packages/demos/src/modules/${id}.tsx`),
      timeline:pinFile(root,`packages/demos/src/timelines/${id}.ts`),
      runtime:config.resourcePins.canonicalRuntime}};
  const fragment={calibrationId:config.calibrationId,deploymentScope:'local-only',
    freezeManifest:`catalog/product-bridge-calibrations/${config.calibrationId}.json`,
    freezeManifestBytes:1,freezeManifestSha256:'a'.repeat(64),entries:[entry]};
  const transaction=readRegistryTransaction(root);
  const predecessor={...transaction.registry,calibrations:transaction.registry.calibrations.filter(
    item=>item.calibrationId!==config.calibrationId)};
  const projected=upsertPrivateCurrentJsCalibration(predecessor,fragment);
  assert(projected.calibrations.some(item=>item.calibrationId===config.calibrationId));
  assert.equal(entry.artifacts.runtime.path,
    config.resourcePins.canonicalRuntime.path);
  assert.notEqual(entry.artifacts.runtime.path,config.resourcePins.nativeRuntime.path);
});
