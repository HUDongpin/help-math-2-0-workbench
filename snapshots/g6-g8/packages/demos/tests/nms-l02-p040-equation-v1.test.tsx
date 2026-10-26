import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P040Equation,p040EquationDescription} from '../src/nms-l02-p040-equation-v1';
test('accessible math does not announce future decimal results',()=>{
 assert.equal(p040EquationDescription(127),'');assert.doesNotMatch(p040EquationDescription(199),/40 over 100/);
 assert.doesNotMatch(p040EquationDescription(380),/0\.40/);assert.match(p040EquationDescription(424),/0\.40/);assert.doesNotMatch(p040EquationDescription(425),/equals 0\.4\./);assert.match(p040EquationDescription(440),/equals 0\.4\./);
});
test('source overlay and equation tokens remain frame-bound',()=>{
 const at=renderToStaticMarkup(<P040Equation frame={243}/>);assert.match(at,/data-source-character="38"/);
 assert.doesNotMatch(renderToStaticMarkup(<P040Equation frame={244}/>),/data-source-character="38"/);
 assert.doesNotMatch(renderToStaticMarkup(<P040Equation frame={243} reducedMotion/>),/data-source-character="38"/);
 assert.match(renderToStaticMarkup(<P040Equation frame={440}/>),/textLength=/);
});
