/** The source-pinned NMS002 L2 index.xml has 64 active lesson pages. These
 * paths identify versions of its modern whole-lesson host; the active slide
 * can differ from the entry URL. Asset identity still comes from the caller's
 * exact name, source binding and SHA, never from this path alone. */
export function isNmsL02SourceResourceHostPath(pathname:string):boolean {
 return /^\/(en|es)\/migration-status\/g678-calibration\/shared-nms002-l02-p(?:00[1-9]|0[1-5][0-9]|06[0-4])$/u.test(pathname);
}
