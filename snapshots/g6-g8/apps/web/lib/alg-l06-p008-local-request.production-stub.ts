/** Local P008 resources have no production lookup table and every request is denied. */
import type {P008_RESOURCE_PINS as DevelopmentPins} from './alg-l06-p008-local-request-v1';
export type {P008Resource} from './alg-l06-p008-local-request-v1';
export const P008_RESOURCE_PINS=Object.freeze({}) as typeof DevelopmentPins;
export const isP008ResourceRequest=()=>false;
export const p008ResourceUrl=()=>'';
