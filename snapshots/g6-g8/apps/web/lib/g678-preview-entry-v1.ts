/** A tab-local marker distinguishes refreshing this entry from opening another source entry. */
export function encodeG678PreviewEntry(identity:string,pathname:string):string {
 return JSON.stringify({version:1,identity,pathname});
}
export function isSameG678PreviewEntry(serialized:string|null,identity:string,pathname:string):boolean {
 if(!serialized)return false;
 try{const value=JSON.parse(serialized) as {version?:unknown;identity?:unknown;pathname?:unknown};return value.version===1&&value.identity===identity&&value.pathname===pathname;}catch{return false;}
}
