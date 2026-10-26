import {test} from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {NmsL2P052SourceRuntimeV1} from '../../../apps/web/components/nms-l02-p052-source-runtime-v1';
test('host adapter never mounts a player or connects controls during SSR',()=>{
 const props={animationId:'shared-nms002-l02-p052',moduleKey:'shared-nms002-l02-p052',audioEnabled:true,
  query:{frameDomain:'sprite-350',scenario:'intro',lang:'es',seed:'0'},
  labels:{replay:'Replay',reduced:'Reduced',prototype:'Prototype',unavailable:'Unavailable',loading:'Loading'},
  connectRuntimeControls:()=>{assert.fail('SSR must not connect controls');return()=>{};},onRuntimePausedChange:()=>assert.fail('SSR callback')};
 const html=renderToStaticMarkup(<NmsL2P052SourceRuntimeV1 {...props}/>);
 assert.ok(html.includes('Loading')||html.includes('Unavailable'));assert.ok(!html.includes('data-p052-player-phase'));
 const denied=renderToStaticMarkup(<NmsL2P052SourceRuntimeV1 {...props} audioEnabled={false}/>);
 assert.ok(denied.includes('P052_PRIVATE_SCOPE'));assert.ok(denied.includes('Unavailable'));
});
