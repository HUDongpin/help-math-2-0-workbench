'use client';
import {useId, useLayoutEffect, useRef} from 'react';
import {NMS_L02_P002_ART as ART} from './generated/nms-l02-p002-art-ir-v1';
import type {P002FrameState} from './nms-l02-p002-timeline-v1';
import type {P002Color} from './nms-l02-p002-source-contract-v1';
import {p002ReplacesNode} from './nms-l02-p002-text-v1';

const NS = 'http://www.w3.org/2000/svg';
const IDENTITY_COLOR = [1,1,1,1,0,0,0,0];
function element(tag: string, attrs: Record<string,string|number> = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [key,value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}
export function p002Interpolate(start: string, end: string, ratio: number): string {
  const t = ratio / 65535;
  if (/^#[0-9a-f]{6}$/iu.test(start)) {
    return '#' + [1,3,5].map(i => Math.round(parseInt(start.slice(i,i+2),16) * (1-t) + parseInt(end.slice(i,i+2),16) * t).toString(16).padStart(2,'0')).join('');
  }
  const number = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/gu;
  const a = [...start.matchAll(number)], b = [...end.matchAll(number)];
  if (a.length !== b.length || start.replace(number,'#') !== end.replace(number,'#')) throw Error('P002_MORPH_TOPOLOGY');
  let i = 0;
  return start.replace(number, () => String(Number(a[i]![0]) * (1-t) + Number(b[i++]![0]) * t));
}

/** One SVG resource graph per mounted figure. No glyph contours, text painting,
 * SMIL or second clock. Per-frame nodes use the source's pure display list. */
function prepareArtwork(svg: SVGSVGElement, prefix: string) {
  const defs = element('defs'), scene = element('g'), masks = element('defs');
  svg.append(defs, masks, scene);
  const local = (value: string) => value.replaceAll('nms2p2-', prefix + '-source-');
  for (const image of ART.images) defs.append(element('image', {id:local(image.id),href:image.uri,width:image.width,height:image.height}));
  const bases = new Map<number, SVGElement>();
  for (const shape of Object.values(ART.art)) {
    if ([214,216,232,265,305,306,307,312,314].includes(shape.characterId)) continue;
    const group = element('g', {id:prefix+'-shape-'+shape.characterId});
    group.innerHTML = local(shape.body); // Hash-locked generated SVG; never user markup.
    defs.append(group); bases.set(shape.characterId, group);
  }
  const morphs = new Map<string,string>(), colors = new Map<string,string>();
  function shapeId(id: number, ratio: number): string {
    const base = bases.get(id)!, source = ART.art[id]!;
    if (!source.morphs.length) return base.id;
    const key = `${id}-${ratio}`, cached = morphs.get(key);
    if (cached) return cached;
    const copy = base.cloneNode(true) as SVGElement;
    copy.id = prefix+'-morph-'+key;
    // Morph-local gradient/clip IDs must remain unique even with two figures.
    const replacements = new Map<string,string>();
    for (const child of copy.querySelectorAll('[id]')) replacements.set(child.id, copy.id+'-'+child.id);
    for (const child of copy.querySelectorAll('*')) for (const attr of [...child.attributes]) {
      let value = attr.value;
      if (attr.name === 'id') value = replacements.get(value) ?? value;
      else for (const [before,after] of replacements) value = value === '#'+before ? '#'+after : value.replaceAll(`url(#${before})`,`url(#${after})`);
      if (value !== attr.value) child.setAttribute(attr.name, value);
    }
    const paths = copy.querySelectorAll('path');
    for (const path of source.morphs) for (const attr of path.attributes) paths[path.pathIndex]!.setAttribute(attr.attribute, p002Interpolate(attr.start,attr.end,ratio));
    defs.append(copy); morphs.set(key,copy.id); return copy.id;
  }
  function filter(color: P002Color): string | null {
    if (color.every((value,i) => value === IDENTITY_COLOR[i])) return null;
    const key = color.join(','), cached = colors.get(key);
    if (cached) return cached;
    const id = prefix+'-color-'+colors.size;
    const f = element('filter', {id,'color-interpolation-filters':'sRGB'});
    f.append(element('feColorMatrix', {type:'matrix',values:[color[0],0,0,0,color[4],0,color[1],0,0,color[5],0,0,color[2],0,color[6],0,0,0,color[3],color[7]].join(' ')}));
    defs.append(f); colors.set(key,id); return id;
  }
  return {
    draw(state: P002FrameState) {
      masks.replaceChildren(); scene.replaceChildren();
      const clipIds = new Map<string,string>();
      for (const node of state.nodes) {
        if (p002ReplacesNode(node) || !bases.has(node.characterId)) continue;
        let outer = element('g', {'data-source-instance':node.instancePath}); scene.append(outer);
        for (const mask of node.masks) {
          let id = clipIds.get(mask.key);
          if (!id) {
            id = prefix+'-mask-'+clipIds.size; clipIds.set(mask.key,id);
            const clip = element('clipPath', {id,clipPathUnits:'userSpaceOnUse'});
            const geometry = ART.maskGeometry[mask.characterId];
            if (!geometry) throw Error('P002_MISSING_MASK');
            for (const path of geometry) {
              const morph = path.morph.find(attr => attr.attribute === 'd');
              clip.append(element('path', {d:morph?p002Interpolate(morph.start,morph.end,mask.ratio):path.d,'clip-rule':path.fillRule,transform:`matrix(${mask.matrix.join(' ')})`}));
            }
            masks.append(clip);
          }
          const next = element('g', {'clip-path':`url(#${id})`}); outer.append(next); outer = next;
        }
        const group = element('g', {transform:`matrix(${node.matrix.join(' ')})`}), color = filter(node.color);
        if (color) group.setAttribute('filter',`url(#${color})`);
        group.append(element('use', {href:'#'+shapeId(node.characterId,node.ratio)})); outer.append(group);
      }
      svg.dataset.sourceFrame = String(state.mainFrame ?? 0);
      svg.dataset.artReady = 'true';
    },
    dispose() {svg.replaceChildren(); bases.clear(); morphs.clear(); colors.clear();},
  };
}

export function NmsL2P002Artwork({state}: {state:P002FrameState}) {
  const id = useId().replace(/[^a-z0-9-]/giu,'');
  const svg = useRef<SVGSVGElement|null>(null);
  const drawing = useRef<ReturnType<typeof prepareArtwork>|null>(null);
  useLayoutEffect(() => {
    if (!svg.current) return;
    drawing.current = prepareArtwork(svg.current,'p002-'+id);
    return () => {drawing.current?.dispose(); drawing.current = null;};
  },[id]);
  useLayoutEffect(() => {drawing.current?.draw(state);},[state,id]);
  return <svg ref={svg} className="nms-l02-p002__scene" viewBox="69.15 81.05 679.2 403.35" aria-hidden="true" focusable="false"/>;
}
