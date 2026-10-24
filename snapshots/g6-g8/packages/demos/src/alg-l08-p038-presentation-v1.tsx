'use client';
import { createElement, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { AnimationRendererProps } from './contract';
import { LessonAnimationTitleV1 } from './lesson-animation-title-v1';
import { ALG_L08_P038_BEHAVIOR as S, p038CanInteract, type P038Point, type P038PointName, type P038State, type P038Term } from './alg-l08-p038-state-v1';
import { ALG_L08_P038_PRESENTATION_SOURCE as V, type P038Visual, type P038Node, type P038Placement, type P038ColorTransform } from './alg-l08-p038-presentation-source-v1';
import { algL08P038Frame, p038PointVisual, type P038View } from './alg-l08-p038-frame-v1';
import './alg-l08-p038-v1.css';
export interface P038PresentationProps {
  view: P038View; controlsLocked?: boolean;
  onNamedPoint?: (name: P038PointName) => void; onBackgroundPoint?: (point: P038Point) => void; onClonePoint?: (name: string) => void;
  onSubmit?: (button?: HTMLElement | SVGElement) => void; onHelp?: (button?: HTMLElement | SVGElement) => void;
  onHelpClose?: () => void; onHintClose?: () => void; onWrongClose?: () => void; onTerm?: (term: P038Term, button: HTMLButtonElement) => void;
}
const matrix = (value: readonly number[], scale = 1) => `matrix(${value[0] * scale} ${value[1] * scale} ${value[2] * scale} ${value[3] * scale} ${value[4]} ${value[5]})`;
const color = (value: readonly number[]) => `rgba(${value[0]},${value[1]},${value[2]},${value[3] / 255})`;
const rgbNeeded = (value: P038ColorTransform) => value.multiply.slice(0, 3).some(n => n !== value.divisor) || value.add.slice(0, 3).some(n => n !== 0);
const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-');
function RgbFilter({ value, id }: { value: P038ColorTransform; id: string }) {
  return <filter id={id} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB"><feComponentTransfer>
    <feFuncR type="linear" slope={value.multiply[0] / value.divisor} intercept={value.add[0] / 255} />
    <feFuncG type="linear" slope={value.multiply[1] / value.divisor} intercept={value.add[1] / 255} />
    <feFuncB type="linear" slope={value.multiply[2] / value.divisor} intercept={value.add[2] / 255} /><feFuncA type="identity" />
  </feComponentTransfer></filter>;
}
function Definitions({ prefix }: { prefix: string }) {
  return <defs>{V.glyphs.map(glyph => <path key={glyph.id} id={`${prefix}-glyph-${glyph.id}`} d={glyph.d} />)}
    {V.shapes.flatMap(shape => shape.gradients.map(gradient => createElement(gradient.kind, { ...gradient.attributes, id: `${prefix}-${shape.key}-${gradient.attributes.id}`, key: `${shape.key}-${gradient.attributes.id}` }, gradient.stops.map((stop, index) => <stop key={index} offset={stop.offset} stopColor={stop['stop-color']} stopOpacity={stop['stop-opacity']} />))))}
    {V.shapes.flatMap(shape => shape.patterns.map(pattern => <pattern key={`${shape.key}-${pattern.attributes.id}`} {...pattern.attributes} id={`${prefix}-${shape.key}-${pattern.attributes.id}`}>{pattern.images.map((image, index) => <image key={index} {...image.attributes} href={image.href} preserveAspectRatio="none" />)}</pattern>))}
  </defs>;
}
function NativeNode({ node, prefix, dynamicText }: { node: P038Node; prefix: string; dynamicText?: string }) {
  const id = `${prefix}-rgb-${safeId(node.instanceId)}`, filtered = rgbNeeded(node.colorTransform);
  let content: ReactNode;
  if (node.kind === 'text') {
    const definition = V.textDefinitions.find(text => text.sourceCharacterId === node.sourceCharacterId)!;
    content = <g transform={matrix(definition.textMatrix)} aria-label={node.sourceCharacterId === 578 ? 'one third' : definition.text} data-source-text-id={node.sourceTextId}>{definition.runs.map((run, index) => <g key={index} fill={color(run.colorRgba)} data-source-font-height={run.fontHeightTwips} data-source-baseline={run.y}>{run.glyphs.map((glyph, n) => <use key={n} href={`#${prefix}-glyph-${glyph.glyphId}`} transform={`translate(${glyph.x} ${run.y}) scale(${run.fontHeightTwips / 1024})`} data-source-glyph={glyph.text} />)}</g>)}</g>;
  } else if (node.kind === 'vector') {
    const shape = V.shapes.find(shape => shape.key === node.shapeKey)!;
    const replace = (value: string | undefined) => value?.replace(/url\(#([^)]*)\)/g, `url(#${prefix}-${node.shapeKey}-$1)`);
    content = <g transform="scale(20)" data-source-shape={node.sourceShapeId} data-source-morph-ratio={shape.morph ? node.ratio : undefined}>{shape.paths.map((path, index) => <path key={index} d={path.d} fill={replace(path.fill)} fillOpacity={path['fill-opacity']} stroke={replace(path.stroke)} strokeWidth={path['stroke-width']} strokeOpacity={path['stroke-opacity']} strokeLinecap={path['stroke-linecap'] as 'round' | 'butt' | 'square' | undefined} strokeLinejoin={path['stroke-linejoin'] as 'round' | 'miter' | 'bevel' | undefined} fillRule="evenodd" />)}</g>;
  } else {
    // Source edit fields used device text (useOutlines=false); their current strings are supplied by the callback reducer.
    const field = V.dynamicTextFields.find(field => field.characterId === node.sourceCharacterId)!;
    const bounds = field.boundsTwips as { left: number; right: number; top: number; bottom: number }, height = field.fontHeightTwips as number, layout = field.layout as { leadingTwips: number };
    content = <foreignObject x={bounds.left} y={bounds.top} width={bounds.right - bounds.left} height={bounds.bottom - bounds.top} data-source-dynamic-field={node.sourceCharacterId}><div className="alg-l08-p038__device-text" style={{ fontSize: height, lineHeight: `${height + layout.leadingTwips}px`, color: color(field.colorRgba as readonly number[]) }}>{dynamicText ?? ''}</div></foreignObject>;
  }
  return <g transform={matrix(node.matrix)} opacity={node.alpha} filter={filtered ? `url(#${id})` : undefined} data-source-instance-id={node.instanceId} data-source-depth={node.depth}>
    {filtered && <defs><RgbFilter id={id} value={node.colorTransform} /></defs>}{content}
  </g>;
}
function Placement({ placement, prefix, children }: { placement: P038Placement; prefix: string; children: ReactNode }) {
  const transform = placement.colorTransform, id = `${prefix}-placement-rgb-${safeId(placement.instanceId)}`;
  return <g transform={matrix(placement.matrix)} opacity={transform ? Math.max(0, Math.min(1, (transform.multiply[3] + transform.add[3]) / transform.divisor)) : 1} filter={transform && rgbNeeded(transform) ? `url(#${id})` : undefined} data-source-placement={placement.instanceId} data-source-depth={placement.depth}>
    {transform && rgbNeeded(transform) && <defs><RgbFilter id={id} value={transform} /></defs>}{children}
  </g>;
}
function Scene({ visual, prefix, state, interactive = false, dynamicText, suppressMain = false }: { visual: P038Visual; prefix: string; state: P038State; interactive?: boolean; dynamicText?: string; suppressMain?: boolean }) {
  const entries: { depth: number; key: string; content: ReactNode }[] = visual.nodes.map(node => ({ depth: node.depth, key: node.instanceId, content: <NativeNode node={node} prefix={prefix} dynamicText={dynamicText} /> }));
  for (const control of visual.controls) {
    const button = V.buttons.find(button => button.sourceButtonId === control.sourceButtonId)!;
    const action = control.sourceButtonId === 69 ? 'background' : control.sourceButtonId === 67 ? 'submit' : control.sourceButtonId === 15 ? 'help' : null;
    entries.push({ depth: control.placement.depth, key: control.placement.instanceId, content: <Placement placement={control.placement} prefix={prefix}>
      <g data-source-button-id={button.sourceButtonId}>{button.states.up.map(node => <NativeNode key={node.instanceId} node={node} prefix={prefix} />)}</g>
      {action && <g data-p038-hit={action} data-hit-depth={control.placement.depth} data-enabled={interactive} opacity={0}>{button.states.hitTest.map(node => <NativeNode key={node.instanceId} node={node} prefix={prefix} />)}</g>}
    </Placement> });
  }
  for (const child of visual.children) {
    let childVisual: P038Visual | null = null, enabled = false, name: string | null = null;
    if (child.disposition === 'interactive-fixed-point') {
      const point = state.fixed.find(point => point.name === child.placement.name?.text);
      if (point?.visible) { childVisual = p038PointVisual(child.spriteId, point.frame); name = point.name; enabled = interactive && point.enabled; }
    } else if (child.disposition === 'offstage-dynamic-point-template') childVisual = p038PointVisual(549, 1);
    else if (child.disposition === 'unselected-offstage-coach-audio') childVisual = V.offstageAudioMarkers.find(marker => marker.spriteId === child.spriteId)!.firstFrame;
    else if (child.disposition === 'main-animation' && !suppressMain) throw new Error('P038_MAIN_REQUIRES_EXPLICIT_DOMAIN');
    entries.push({ depth: child.placement.depth, key: child.placement.instanceId, content: <Placement placement={child.placement} prefix={prefix}><g data-source-child-sprite={child.spriteId} data-source-child-disposition={child.disposition} data-p038-hit={name ?? undefined} data-hit-depth={child.placement.depth} data-enabled={enabled}>
      {childVisual && <Scene visual={childVisual} prefix={prefix} state={state} />}
    </g></Placement> });
  }
  return <>{entries.sort((a, b) => a.depth - b.depth).map(entry => <g key={entry.key}>{entry.content}</g>)}</>;
}
function NativeDiagram({ visual, state, prefix, viewBox, label, dynamicText }: { visual: P038Visual; state: P038State; prefix: string; viewBox: readonly number[]; label: string; dynamicText?: string }) {
  return <svg className="alg-l08-p038__native-diagram" viewBox={viewBox.join(' ')} role="img" aria-label={label}><Definitions prefix={prefix} /><Scene visual={visual} state={state} prefix={prefix} dynamicText={dynamicText} /></svg>;
}
function Terms({ coach = false, props }: { coach?: boolean; props: P038PresentationProps }) {
  const { view, onTerm } = props, hotspots = coach ? V.coachHotspots : V.mainHotspots, disabled = props.controlsLocked || Boolean(view.state.glossary) || !coach && (view.state.help || Boolean(view.state.hint) || Boolean(view.state.wrong));
  return onTerm && <nav className="alg-l08-p038__terms" lang={view.language} aria-label={view.language === 'es' ? 'Términos clave' : 'Key terms'}>{hotspots.map(hotspot => <button key={hotspot.instanceId} type="button" disabled={disabled} data-source-hotspot-id={hotspot.instanceId} data-source-button-id={hotspot.sourceButtonId} data-source-term={hotspot.term} data-source-term-owner={coach ? 'coach' : 'main'} onClick={event => onTerm(hotspot.term as P038Term, event.currentTarget)}>{V.terms.find(term => term.id === V.sourceTermKeys[hotspot.term])!.labels[view.language]}</button>)}</nav>;
}
function Overlay({ title, kind, glossary, language, onClose, children }: { title: string; kind: 'coach' | 'hint' | 'wrong'; glossary: boolean; language: 'en' | 'es'; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null), prior = useRef<Element | null>(null), focus = useRef<HTMLElement | null>(null), savedScroll = useRef(0), id = useId();
  useEffect(() => { prior.current = document.activeElement; return () => { const element = prior.current; if (element instanceof HTMLElement && element.isConnected) element.focus({ preventScroll: true }); }; }, []);
  useEffect(() => {
    const element = dialog.current; if (!element) return;
    if (glossary) element.close(); else { if (!element.open) element.showModal(); element.scrollTop = savedScroll.current; if (focus.current?.isConnected) focus.current.focus({ preventScroll: true }); else element.querySelector<HTMLButtonElement>('[data-p038-close]')?.focus(); }
    return () => { savedScroll.current = element.scrollTop; element.close(); };
  }, [glossary]);
  return <dialog ref={dialog} className="alg-l08-p038__dialog" aria-labelledby={id} data-p038-overlay={kind} onCancel={event => { event.preventDefault(); onClose(); }} onFocusCapture={event => { if (event.target instanceof HTMLElement) focus.current = event.target; }}>
    <div className="alg-l08-p038__overlay-heading"><h3 id={id}>{title}</h3><button type="button" lang={language} data-p038-close={kind} onClick={onClose}>{language === 'es' ? 'Cerrar' : 'Close'}</button></div>{children}
  </dialog>;
}
function Graph({ props, prefix }: { props: P038PresentationProps; prefix: string }) {
  const { view, onNamedPoint, onBackgroundPoint, onClonePoint, onSubmit, onHelp } = props, state = view.state, interactive = p038CanInteract(state) && !props.controlsLocked;
  const svg = useRef<SVGSVGElement>(null), id = useId(), [cursor, setCursor] = useState<P038Point>({ x: -1322, y: 1237 }), [showCursor, setShowCursor] = useState(false);
  const bounds = V.backgroundHit.shapeBoundsTwips, transform = V.backgroundHit.mainPlacement.matrix;
  const limits = [bounds.left + transform[4], bounds.right + transform[4], bounds.top * transform[3] + transform[5], bounds.bottom * transform[3] + transform[5]];
  useEffect(() => { setCursor({ x: -1322, y: 1237 }); setShowCursor(false); }, [state.replay]);
  const chooseScreenPoint = (screen: DOMPoint) => {
    if (!interactive || !svg.current) return;
    const candidates = [...svg.current.querySelectorAll<SVGGElement>('g[data-p038-hit]')].sort((a, b) => Number(b.dataset.hitDepth) - Number(a.dataset.hitDepth));
    for (const target of candidates) {
      if (target.dataset.enabled !== 'true') continue;
      const hit = [...target.querySelectorAll<SVGGeometryElement>('path')].some(path => { const ctm = path.getScreenCTM(); return ctm && path.isPointInFill(screen.matrixTransform(ctm.inverse())); });
      if (!hit) continue;
      const name = target.dataset.p038Hit!;
      if (name === 'background') { const ctm = svg.current.getScreenCTM(); if (ctm) { const point = screen.matrixTransform(ctm.inverse()); onBackgroundPoint?.({ x: point.x, y: point.y }); } }
      else if (name === 'submit') onSubmit?.(target); else if (name === 'help') onHelp?.(target); else if (name.startsWith('PT_')) onNamedPoint?.(name as P038PointName); else onClonePoint?.(name);
      return;
    }
  };
  return <><p className="alg-l08-p038__keyboard" id={id} lang={view.language}>{view.language === 'es' ? 'En el gráfico: usa las flechas para mover el cursor y Enter o Espacio para elegir un punto. También puedes hacer clic o tocar.' : 'On the graph: use arrow keys to move the cursor and Enter or Space to choose a point. You can also click or tap.'}</p>
    <div className="alg-l08-p038__scroll" role="region" tabIndex={0} aria-label={view.language === 'es' ? 'Gráfico de coordenadas' : 'Coordinate graph'} aria-describedby={id} data-p038-graph-scroll="true" onKeyDown={event => {
      if (!interactive) return; const step = event.shiftKey ? 25.6 : 256, deltas: Record<string, readonly number[]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (deltas[event.key]) { event.preventDefault(); const [x, y] = deltas[event.key]; setShowCursor(true); setCursor(point => ({ x: Math.max(limits[0], Math.min(limits[1], point.x + x)), y: Math.max(limits[2], Math.min(limits[3], point.y + y)) })); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setShowCursor(true); const ctm = svg.current?.getScreenCTM(); if (ctm) chooseScreenPoint(new DOMPoint(cursor.x, cursor.y).matrixTransform(ctm)); }
    }}>
      <svg ref={svg} className="alg-l08-p038__native-diagram" viewBox={V.stage.viewBox.join(' ')} aria-label="Graph the linear equation y equals one third x plus two using the slope and y-intercept." role="img" data-p038-graph="true" onClick={event => chooseScreenPoint(new DOMPoint(event.clientX, event.clientY))}>
        <Definitions prefix={prefix} />
        <g transform="translate(-8248 -5666)"><Scene visual={view.rootVisual} state={state} prefix={prefix} suppressMain /></g>
        <Scene visual={view.visual} state={state} prefix={prefix} interactive={interactive} />
        {state.line?.visible && <line data-p038-drawn-line="true" data-source-runtime-depth={state.line.depth} x1={state.line.from.x} y1={state.line.from.y} x2={state.line.to.x} y2={state.line.to.y} stroke="#0000ff" strokeWidth={60} pointerEvents="none" />}
        {state.clones.filter(point => point.visible).map(point => <g key={point.name} transform={`translate(${point.x} ${point.y})`} data-p038-hit={point.name} data-hit-depth={point.depth} data-enabled={interactive && point.enabled} data-source-requested-frame={point.requestedFrame} data-source-rendered-frame={point.renderedFrame}><Scene visual={p038PointVisual(549, 1)} state={state} prefix={prefix} /></g>)}
        {showCursor && interactive && <g transform={`translate(${cursor.x} ${cursor.y})`} pointerEvents="none" data-p038-keyboard-cursor="true" stroke="#16426e" strokeWidth={15} fill="none"><circle r={105} /><path d="M-140 0H140M0-140V140" /></g>}
      </svg>
    </div>
    {showCursor && interactive && <p className="alg-l08-p038__cursor-status" role="status" lang={view.language}>{view.language === 'es' ? 'Cursor del gráfico' : 'Graph cursor'}: x {Number(((cursor.x + 1322) / 256).toFixed(1))}, y {Number(((1237 - cursor.y) / 256).toFixed(1))}</p>}
  </>;
}
export function AlgL08P038Presentation(props: P038PresentationProps) {
  const { view, onSubmit, onHelp, onHelpClose, onHintClose, onWrongClose } = props, state = view.state, es = view.language === 'es', prefix = safeId(useId()) + '-p038';
  if (!view.ready) return <section data-animation-id={S.animationId} aria-busy="true" />;
  const body = <Graph props={props} prefix={prefix} />;
  const coach = <><Terms props={props} coach /><div className="alg-l08-p038__scroll" role="region" tabIndex={0} data-p038-coach-scroll="true" aria-label={es ? 'Pasos de ayuda; desplaza horizontalmente si hace falta' : 'Help steps; scroll horizontally if needed'}><NativeDiagram visual={V.coachVisual} state={state} prefix={prefix + '-coach'} viewBox={V.coachViewBox} label="The y-intercept is the constant term when the equation is in slope-intercept form. Graph the y-intercept first, then count up one place and right three places, and draw the line." /></div></>;
  const popup = (kind: 'hint' | 'wrong', text: string) => {
    if (kind === 'wrong') {
      const backdrop = V.popupVisuals.find(popup => popup.spriteId === 548)!.states[0].value.nodes.find(node => node.kind === 'vector' && node.sourceShapeId === 545)!;
      // Shape 545 keeps its exact source bounds and paths. Live field 546 flows independently of the Flash field height.
      return <div className="alg-l08-p038__feedback" role="region" tabIndex={0} data-p038-message-scroll={kind} aria-label={es ? 'Comentario' : 'Feedback'}>
        <svg className="alg-l08-p038__feedback-art" viewBox="-14420 -121 12972 1777" preserveAspectRatio="none" aria-hidden="true" focusable="false"><NativeNode node={backdrop} prefix={prefix + '-wrong-backdrop'} /></svg>
        <p className="alg-l08-p038__feedback-text" lang="en" data-source-dynamic-field={546}>{text}</p>
      </div>;
    }
    return <div className="alg-l08-p038__scroll" role="region" tabIndex={0} data-p038-message-scroll={kind} aria-label={es ? 'Comentario' : 'Feedback'}><NativeDiagram visual={V.popupVisuals.find(popup => popup.spriteId === 544)!.states[0].value} state={state} prefix={prefix + '-' + kind} viewBox={V.sourcePopupViewBox} label={text} dynamicText={text} /></div>;
  };
  return <section className="alg-l08-p038" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-swf-sha256={S.sourceSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-main-content-language="en" data-source-english-fallback={es} lang="en">
    <LessonAnimationTitleV1 courseTitle="" activityTitle={S.title} language="en" />
    <Terms props={props} />
    {view.inspectionVisual ? <div className="alg-l08-p038__scroll"><NativeDiagram visual={view.inspectionVisual} state={state} prefix={prefix + '-inspection'} viewBox={view.frameDomain === 'sprite-570' ? V.coachViewBox : V.stage.viewBox} label="Selected source frame" /></div> : body}
    {state.mainFrame === 208 && !view.inspectionVisual && <div className="alg-l08-p038__actions" lang={view.language}>
      <button type="button" data-p038-submit="true" disabled={props.controlsLocked || !p038CanInteract(state)} onClick={event => onSubmit?.(event.currentTarget)}>{es ? 'Dibujar la recta' : 'Draw Line'}</button>
      <button type="button" data-p038-help="true" disabled={props.controlsLocked || !p038CanInteract(state)} onClick={event => onHelp?.(event.currentTarget)}>{es ? 'Más ayuda' : 'Need More Help'}</button>
    </div>}
    {state.help && !view.inspectionVisual && (onHelpClose ? <Overlay title={es ? 'Más ayuda' : 'Need More Help'} kind="coach" language={view.language} glossary={Boolean(state.glossary)} onClose={onHelpClose}>{coach}</Overlay> : coach)}
    {state.hint && (onHintClose ? <Overlay title={es ? 'Dibujar la recta' : 'Draw Line'} kind="hint" language={view.language} glossary={Boolean(state.glossary)} onClose={onHintClose}>{popup('hint', state.hint)}</Overlay> : popup('hint', state.hint))}
    {state.wrong && (onWrongClose ? <Overlay title={es ? 'Inténtalo de nuevo' : 'Try again'} kind="wrong" language={view.language} glossary={Boolean(state.glossary)} onClose={onWrongClose}>{popup('wrong', state.wrong)}</Overlay> : popup('wrong', state.wrong))}
  </section>;
}
export function AlgL08P038Renderer(props: AnimationRendererProps) { return <AlgL08P038Presentation view={algL08P038Frame(props.frame, { ...props, frame: props.frame })} />; }
