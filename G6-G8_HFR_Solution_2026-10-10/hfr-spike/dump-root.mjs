import { readFileSync } from "node:fs"; import { parseSwf } from "./swf.mjs";
const swf = parseSwf(readFileSync(process.argv[2]));
console.log("frames", swf.root.frames.length, "labels", swf.root.frames.labels);
swf.root.frames.forEach((f, i) => console.log(i + 1, f.map((t) => t.op === "place" ? `place(d${t.depth}${t.charId!==undefined?" c"+t.charId+"("+swf.dict.get(t.charId)?.kind+(swf.dict.get(t.charId)?.frameCount?":"+swf.dict.get(t.charId).frameCount:"")+")":""}${t.name?" '"+t.name+"'":""}${t.move?" mv":""})` : t.op === "label" ? `label(${t.name})` : t.op).join(" ")));
