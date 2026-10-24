/** Local P010 resources have no production lookup table and every request is denied. */
import type {P010_RESOURCE_PINS as DevelopmentPins} from './alg-l06-p010-local-request-v1';
export type {P010Resource} from './alg-l06-p010-local-request-v1';
export const P010_RESOURCE_PINS=Object.freeze({}) as typeof DevelopmentPins;
export const isP010ResourceRequest=()=>false;
export const p010ResourceUrl=()=>'';
