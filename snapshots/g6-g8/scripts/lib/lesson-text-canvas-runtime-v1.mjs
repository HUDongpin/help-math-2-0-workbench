/**
 * This function is emitted as ordinary static JavaScript by the versioned
 * builder. It has no ambient clock, network, DOM creation or code evaluation.
 */
export function createLessonTextCanvasRuntime(config) {
  let active = null;
  const canonicalId = (segments) => segments.map((segment) =>
    `${segment.timelineId}/depth-${segment.depth}/generation-${segment.generation}`,
  ).join(">");
  const matrixEqual = (left, right) => Array.isArray(left) && Array.isArray(right) &&
    left.length === 6 && right.length === 6 && left.every((value, index) =>
      Number.isFinite(value) && Math.abs(value - right[index]) <= 1e-9);
  const multiply = (a, b) => [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];

  function begin(request) {
    if (active !== null) throw new Error("Text observation render is already active");
    const requested = request?.text?.suppressInstanceIds ?? [];
    if (!Array.isArray(requested) || requested.some((id) => typeof id !== "string") ||
        new Set(requested).size !== requested.length) {
      throw new Error("text.suppressInstanceIds must contain unique string identities");
    }
    active = {requested: new Set(requested), scopes: [], pending: null,
      observations: [], diagnostics: [], suppressed: [], requestFrame: request?.frame};
  }

  function enter(timelineId, frame) {
    if (active === null) return null;
    const definition = config.timelines[timelineId];
    const frameIndex = definition && Number.isInteger(frame) && frame >= 0
      ? frame % definition.frameCount : null;
    const framePlan = definition?.frames[String(frameIndex)];
    const parent = active.scopes[active.scopes.length - 1];
    const pending = active.pending;
    let path = [];
    let reason = framePlan?.reason ?? (framePlan ? null : "unsupported-frame-plan");
    if (parent) {
      if (!pending || pending.childTimelineId !== timelineId) {
        reason = "unmapped-nested-timeline-entry";
      } else {
        path = pending.path;
        reason = pending.reason ?? reason;
      }
    } else if (timelineId !== config.entryTimelineId) {
      reason = "unexpected-entry-timeline";
    }
    const scope = {timelineId, localFrame: frameIndex === null ? null : frameIndex + 1,
      path, reason, framePlan, callOrdinal: 0};
    active.scopes.push(scope);
    return scope;
  }

  function leave(scope) {
    if (scope === null || active === null) return;
    if (active.scopes.pop() !== scope) throw new Error("Text timeline stack mismatch");
    if (scope.framePlan && !scope.framePlan.reason &&
        scope.callOrdinal !== scope.framePlan.siteIds.length) {
      active.diagnostics.push({kind: "draw-order-count-mismatch", timelineId: scope.timelineId,
        frame: scope.localFrame, expected: scope.framePlan.siteIds.length,
        actual: scope.callOrdinal});
    }
  }

  function place(siteId, obj, canvas, ctx, matrix, ctrans, blendMode, childFrame,
    ratio, time, draw, scalingGridActive) {
    if (active === null) return draw();
    const scope = active.scopes[active.scopes.length - 1];
    const ordinal = scope ? scope.callOrdinal++ : null;
    const match = scope?.framePlan?.placements[siteId];
    let reason = scope?.reason ?? null;
    if (!scope || !match) reason = reason ?? "unmatched-source-placement";
    if (scope && scope.framePlan?.siteIds[ordinal] !== siteId) {
      reason = reason ?? "draw-order-mismatch";
    }
    if (match && (match.objectName !== obj || !matrixEqual(match.matrix, matrix))) {
      reason = reason ?? "actual-placement-arguments-drifted";
    }
    if (blendMode !== 1) reason = reason ?? "unsupported-blend-mode";
    if (scalingGridActive) reason = reason ?? "unsupported-scaling-grid";
    const characterIdMatch = /^(?:text|sprite|shape|morphshape|button|image)(\d+)$/.exec(obj);
    const characterId = characterIdMatch ? Number(characterIdMatch[1]) : null;
    const segment = match ? {timelineId: scope.timelineId, depth: match.depth,
      generation: match.generation, characterId: match.characterId} : null;
    const path = segment ? [...scope.path, segment] : scope?.path ?? [];
    const sourceInstanceId = segment ? canonicalId(path) : null;
    const bound = sourceInstanceId ? config.bindings[sourceInstanceId] : null;
    const instanceId = bound?.id ?? sourceInstanceId;
    const definition = config.texts[String(characterId)];
    const priorPending = active.pending;
    active.pending = /^sprite\d+$/.test(obj)
      ? {childTimelineId: `sprite-${characterId}`, path, reason} : null;
    let observation = null;
    let suppress = false;
    if (definition) {
      if (definition.reason) reason = reason ?? definition.reason;
      let placementTransform = null;
      let transform = null;
      const colors = [];
      try {
        const native = ctx.getTransform();
        const current = [native.a, native.b, native.c, native.d, native.e, native.f];
        if (!current.every(Number.isFinite)) throw new Error("non-finite context matrix");
        placementTransform = multiply(current, matrix);
        transform = multiply(placementTransform, definition.matrix);
        for (const color of definition.colors) {
          const rgba = ctrans.apply([color[0], color[1], color[2], color[3] / 255]);
          if (rgba.length !== 4 || !rgba.every(Number.isFinite)) throw new Error("invalid color");
          colors.push([rgba[0], rgba[1], rgba[2], rgba[3] * ctx.globalAlpha]);
        }
      } catch {
        reason = reason ?? "actual-transform-or-color-unavailable";
      }
      const requested = instanceId !== null && active.requested.has(instanceId);
      if (requested && !bound) reason = reason ?? "instance-not-in-maintained-binding";
      if (requested && bound && !bound.completeTextReplacement) {
        reason = reason ?? "incomplete-text-replacement-binding";
      }
      suppress = requested && reason === null && bound?.completeTextReplacement === true;
      observation = {
        observationKind: "text-draw-dispatch",
        instanceId, sourceInstanceId,
        instance: instanceId === null ? null : {id: instanceId, path},
        characterId, timelineId: scope?.timelineId ?? null,
        parentTimelinePath: scope?.path ?? [],
        depth: match?.depth ?? null, generation: match?.generation ?? null,
        localFrame: scope?.localFrame ?? null, requestFrame: active.requestFrame,
        sourceTextIds: definition.sourceTextIds.slice(),
        placementTransform, transform,
        transformUnits: "text-local-to-canvas-backing-pixels",
        colorRunsRgba: colors,
        alphaRange: colors.length ? [Math.min(...colors.map(c => c[3])),
          Math.max(...colors.map(c => c[3]))] : null,
        status: reason === null ? "mapped-static" : "unsupported",
        reason, suppressionRequested: requested, suppressed: suppress,
        originalDrawDispatched: false,
        runtimeVisibilityEstablished: false,
      };
      active.observations.push(observation);
      if (reason) active.diagnostics.push({kind: reason, siteId, instanceId,
        characterId, timelineId: scope?.timelineId ?? null, frame: scope?.localFrame ?? null});
    }
    try {
      if (suppress) {
        active.suppressed.push(instanceId);
        return undefined;
      }
      const result = draw();
      if (observation) observation.originalDrawDispatched = true;
      return result;
    } finally {
      active.pending = priorPending;
    }
  }

  function finish(state) {
    const suppressed = new Set(active.suppressed);
    const unfulfilled = [...active.requested].filter(id => !suppressed.has(id));
    for (const instanceId of unfulfilled) active.diagnostics.push({
      kind: "requested-instance-not-drawn-or-ineligible", instanceId,
    });
    return {
      state,
      observations: active.observations,
      diagnostics: active.diagnostics,
      suppressedInstanceIds: [...suppressed],
      unfulfilledSuppressionIds: unfulfilled,
      claimBoundary: {actualSafeJsDrawingObserved: true, originalRuntimeEvidence: false,
        modernizationComplete: false},
    };
  }

  return {begin, enter, leave, place, finish, reset() {active = null;}};
}
