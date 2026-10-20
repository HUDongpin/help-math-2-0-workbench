import {registerHooks} from 'node:module';

const sharpEntry = new URL(import.meta.resolve('sharp')).href;

const source = [
  'const blockedOperations = [];',
  'let decodeCalls = 0;',
  'export function __novaBlockedOperations() { return blockedOperations.slice(); }',
  'export function __novaDecodeCalls() { return decodeCalls; }',
  'function sharp() {',
  '  decodeCalls += 1;',
  '  throw new Error("sharp decode should not run for an untrusted Nova frame");',
  '}',
  'sharp.block = function block(options) {',
  '  if (options && Array.isArray(options.operation)) {',
  '    blockedOperations.push(...options.operation);',
  '  }',
  '};',
  'export default sharp;',
].join('\n');

registerHooks({
  load(url, context, nextLoad) {
    if (url.split('?')[0] === sharpEntry.split('?')[0]) {
      return {
        format: 'module',
        source,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
