import type{Geometry,Bitmap}from'./painter';
import type{createSceneReader}from'./scene';
/** ./assets exports loadIn009Assets(signal):Promise<In009Assets>.
 * Loader verifies exact bytes/dimensions and cleans partial decode failures. */
export interface In009Assets{readonly geometry:Geometry;readonly sceneInputs:Parameters<typeof createSceneReader>[0];readonly bitmaps:ReadonlyMap<number,Bitmap>;readonly bitmap19Url:string;dispose():void;}
