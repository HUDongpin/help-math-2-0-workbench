'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';

/** Keep the existing glossary dialog outside the clipped animation stage.
 * Its state, definition and close action remain owned by the lesson host. */
export function PrivateAudioGlossaryPortal({children}:{children:ReactNode}){
 const [host,setHost]=useState<HTMLElement|null>(null);
 useEffect(()=>setHost(document.body),[]);
 return host?createPortal(children,host):null;
}
