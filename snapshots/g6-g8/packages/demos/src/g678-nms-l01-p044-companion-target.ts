/** Exact modern My Lesson companion slot, never an arbitrary DOM portal. */
export const P044_COMPANION_SUFFIX='nms-l01-p044-readable-instruction';
export function resolveP044CompanionTarget(source:HTMLElement|null,targetId?:string):HTMLElement|null{
  if(!source?.isConnected||!targetId||!(targetId===P044_COMPANION_SUFFIX||targetId.endsWith(`-${P044_COMPANION_SUFFIX}`)))return null;
  const owner=source.closest('.lesson-shell2__learning-column');if(!owner)return null;
  const matches=[...source.ownerDocument.querySelectorAll<HTMLElement>('[id]')].filter(element=>element.id===targetId);
  if(matches.length!==1)return null;
  const target=matches[0];return target.isConnected&&target.tagName==='DIV'&&target.namespaceURI==='http://www.w3.org/1999/xhtml'&&
    target.ownerDocument===source.ownerDocument&&target.dataset.pageInteractionCompanionHost==='true'&&target.parentElement===owner&&
    target.closest('.lesson-shell2__learning-column')===owner&&!source.contains(target)?target:null;
}
