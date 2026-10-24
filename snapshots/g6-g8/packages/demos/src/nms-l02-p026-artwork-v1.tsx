'use client';
import React,{useId}from'react';import{P026_ART}from'./generated/nms-l02-p026-art-v1';
export function P026SourceArt({shape}:{readonly shape:number}){const id=useId().replace(/[^a-zA-Z0-9]/g,''),a=P026_ART[String(shape)];if(!a)return null;return <svg viewBox={a.viewBox.join(' ')} aria-hidden="true" focusable="false"><g dangerouslySetInnerHTML={{__html:a.body.replaceAll('nms2p26-',`p026-${id}-`)}}/></svg>;}
export function P026Fraction({n,d}:{readonly n:number;readonly d:number}){return React.createElement('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true','aria-label':`${n}/${d}`},React.createElement('mfrac',null,React.createElement('mn',null,String(n)),React.createElement('mn',null,String(d))));}
