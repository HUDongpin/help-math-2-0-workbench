import {createHash} from "node:crypto";

export const SOURCE_PROVEN_INDEPENDENT_EVIDENCE_RELATIVE_PATH =
  "audit/source-proven-independent-frame-domain-evidence.json";

export const SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE =
  "multi-frame-local-action-independent-domain";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function frameSequenceContract(frames) {
  invariant(
    Array.isArray(frames)
      && frames.every((frame) => Number.isInteger(frame) && frame >= 1),
    "local-action frame sequence must contain positive one-indexed frames",
  );
  const bytes = Buffer.from(
    frames.length ? `${frames.join("\n")}\n` : "",
    "utf8",
  );
  return {
    frames: [...frames],
    count: frames.length,
    sha256: sha256(bytes),
    encoding: "one-indexed-decimal-frame-newline-v1",
  };
}

function directSwfmillTimeline(stack) {
  const tags = stack.at(-1);
  const owner = stack.at(-2);
  return tags?.name === "tags"
      && (owner?.name === "Header" || owner?.name === "DefineSprite")
    ? owner
    : null;
}

/**
 * Extract ordered, multiplicity-preserving one-indexed direct DoAction frame
 * positions without treating nested action opcodes as timeline tags. This is
 * intentionally separate from the shared static-composite parser so the
 * independent-domain proof can strengthen its own contract without changing
 * unrelated reviewed composite-proof engine identities.
 */
export function extractSwfmillDoActionFrameSequences(xml) {
  invariant(typeof xml === "string" && xml.length > 0, "swfmill XML is empty");
  const stack = [];
  const framesByTimeline = new Map();
  const tokenPattern = /<\/?([A-Za-z_][\w:.-]*)([^>]*)>/g;
  for (const match of xml.matchAll(tokenPattern)) {
    const raw = match[0];
    if (raw.startsWith("<?") || raw.startsWith("<!")) continue;
    const name = match[1];
    if (raw.startsWith("</")) {
      const node = stack.pop();
      invariant(
        node?.name === name,
        `swfmill action-frame XML nesting mismatch: expected ${node?.name || "none"}, received ${name}`,
      );
      continue;
    }
    const selfClosing = /\/\s*>$/.test(raw);
    const attributes = Object.fromEntries(
      [...match[2].matchAll(/([A-Za-z_][\w:.-]*)="([^"]*)"/g)]
        .map((attribute) => [attribute[1], attribute[2]]),
    );
    const node = {name};
    if (name === "Header") {
      node.timelineId = "root";
      node.currentFrame = 1;
      framesByTimeline.set("root", []);
    } else if (name === "DefineSprite") {
      invariant(attributes.objectID, "swfmill DefineSprite objectID is missing");
      node.timelineId = `sprite-${attributes.objectID}`;
      node.currentFrame = 1;
      invariant(
        !framesByTimeline.has(node.timelineId),
        `${node.timelineId}: duplicate DefineSprite in action-frame audit`,
      );
      framesByTimeline.set(node.timelineId, []);
    }
    const timeline = directSwfmillTimeline(stack);
    if (timeline && name === "ShowFrame") {
      timeline.currentFrame += 1;
    } else if (timeline && name === "DoAction") {
      framesByTimeline.get(timeline.timelineId).push(timeline.currentFrame);
    }
    if (!selfClosing) stack.push(node);
  }
  invariant(stack.length === 0, "swfmill action-frame XML ended with unclosed elements");
  invariant(framesByTimeline.has("root"), "swfmill action-frame XML has no root timeline");
  return framesByTimeline;
}

export function bindSwfmillDoActionFrameSequences(structure, xml) {
  invariant(structure?.timelines instanceof Map, "swfmill structure timelines are missing");
  const framesByTimeline = extractSwfmillDoActionFrameSequences(xml);
  invariant(
    framesByTimeline.size === structure.timelines.size,
    "swfmill action-frame timeline census differs from the structural parser",
  );
  for (const [timelineId, timeline] of structure.timelines) {
    const frames = framesByTimeline.get(timelineId);
    invariant(frames, `${timelineId}: action-frame sequence is missing`);
    invariant(
      frames.length === (timeline.tagCounts.DoAction || 0),
      `${timelineId}: direct DoAction count differs from its frame sequence`,
    );
    timeline.doActions = frames.map((frame, index) => ({
      tag: "DoAction",
      frame,
      ordinal: index + 1,
    }));
  }
  return structure;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareTimelineIds(left, right) {
  const leftNumber = Number.parseInt(String(left).replace(/^sprite-/, ""), 10);
  const rightNumber = Number.parseInt(String(right).replace(/^sprite-/, ""), 10);
  return (
    (Number.isInteger(leftNumber) && Number.isInteger(rightNumber)
      ? leftNumber - rightNumber
      : 0)
    || compareText(String(left), String(right))
  );
}

function normalizedTagCensus(tagCounts) {
  return Object.fromEntries(
    Object.entries(tagCounts || {}).sort(([left], [right]) =>
      compareText(left, right)),
  );
}

function normalizedFrameScript(block) {
  return {
    script: block.script,
    frame: block.scope.frame,
    bodyBytes: Buffer.byteLength(block.body, "utf8"),
    bodySha256: block.bodySha256,
    bodyNonempty: block.body.trim().length > 0,
    lineStart: block.lineStart,
    lineEnd: block.lineEnd,
  };
}

function exactTimelineSet(values, label) {
  invariant(Array.isArray(values), `${label}: expected an array`);
  const sorted = [...values].sort(compareTimelineIds);
  invariant(
    new Set(sorted).size === sorted.length,
    `${label}: duplicate timeline ID`,
  );
  invariant(
    sorted.every((timelineId) => /^sprite-\d+$/.test(timelineId)),
    `${label}: invalid timeline ID`,
  );
  return sorted;
}

export function canonicalIndependentPairSet(entries) {
  invariant(Array.isArray(entries), "independent pair set must be an array");
  const lines = entries.map(({animationId, timelineId}) => {
    invariant(
      typeof animationId === "string"
        && animationId.length > 0
        && !animationId.includes("\t")
        && !animationId.includes("\n"),
      "independent pair-set animationId is invalid",
    );
    invariant(
      /^sprite-\d+$/.test(timelineId || ""),
      `${animationId}: independent pair-set timelineId is invalid`,
    );
    return `${animationId}\t${timelineId}`;
  }).sort();
  invariant(
    new Set(lines).size === lines.length,
    "independent pair set contains duplicates",
  );
  const bytes = Buffer.from(lines.length ? `${lines.join("\n")}\n` : "", "utf8");
  return {
    count: lines.length,
    sha256: sha256(bytes),
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  };
}

function rejectedClassification({
  frameCount,
  directDoActionTagCount,
  exactActionCountParity,
  exactActionFrameSequenceParity,
  ffdecFrameScripts,
  parentTimelineId,
  priorDisqualifiers,
}) {
  if (frameCount === 1) {
    return {
      blockerClass: "scripted-one-frame-domain-semantics-unproved",
      nextEvidenceAction:
        "Prove with authoring or authoritative natural-runtime evidence whether the entry/tick ActionScript is wholly represented by a containing behavior state; one source frame alone does not justify either composite or independent-required.",
    };
  }
  if (directDoActionTagCount === 0 && ffdecFrameScripts.length === 0) {
    if (parentTimelineId === "root") {
      return {
        blockerClass: "scriptless-direct-root-local-playhead-needs-runtime-continuation-proof",
        nextEvidenceAction:
          "Capture an authoritative natural trace that proves whether the named direct-root child continues, stops, resets, or is host-controlled after root placement; static placement alone cannot choose composite versus independent-required.",
      };
    }
    if (priorDisqualifiers.includes("parent-is-not-an-exact-declared-frame-domain")) {
      return {
        blockerClass: "scriptless-child-parent-domain-not-declared",
        nextEvidenceAction:
          "First declare or source-prove the exact parent frame domain, then rerun the parent-clock lifetime proof for this child; an undeclared parent cannot absorb the child domain.",
      };
    }
    return {
      blockerClass: "scriptless-multiframe-domain-needs-parent-or-runtime-proof",
      nextEvidenceAction:
        "Obtain an exact declared-parent clock proof or authoritative natural-runtime trace; the current source graph does not positively choose composite versus independent-required.",
    };
  }
  if (exactActionCountParity && !exactActionFrameSequenceParity) {
    return {
      blockerClass: "local-action-frame-sequence-parity-incomplete",
      nextEvidenceAction:
        "Re-extract the exact SWF and reconcile the ordered, multiplicity-preserving one-indexed swfmill DoAction frame sequence with the FFDec local sprite frame-script sequence; equal counts at different local frames do not prove an independent action domain.",
    };
  }
  return {
    blockerClass: "local-action-export-parity-incomplete",
    nextEvidenceAction:
      "Re-extract the exact SWF with swfmill and FFDec and reconcile every direct DoAction with one local sprite frame-script block before assigning a frame-domain disposition.",
  };
}

/**
 * This audit intentionally proves only a stricter obligation. A root-reachable
 * multi-frame DefineSprite with a direct local DoAction and a one-for-one FFDec
 * local frame-script export has source-defined state transitions in its own
 * local frame coordinates. It therefore cannot remain an undeclared domain.
 * The proof does not say the timeline is naturally reached, visually correct,
 * behaviorally reproduced, audible, reviewed, or accepted.
 */
export function deriveSourceProvenIndependentRequiredAudit({
  animationId,
  structure,
  scripts,
  inventory,
  manifest,
  remainingTimelineIds,
  priorDisqualifiersByTimeline = new Map(),
}) {
  invariant(inventory.animationId === animationId, `${animationId}: inventory identity mismatch`);
  invariant(manifest.animationId === animationId, `${animationId}: manifest identity mismatch`);
  const remaining = exactTimelineSet(
    remainingTimelineIds,
    `${animationId}: remaining timeline set`,
  );
  const inventoryByTimeline = new Map(
    (inventory.timelineInventory || []).map((timeline) => [timeline.timelineId, timeline]),
  );
  const declaredTimelineIds = new Set(
    (manifest.implementation?.frameDomains || []).map(
      ({sourceTimelineId}) => sourceTimelineId,
    ),
  );
  const incomingParentIds = new Map();
  for (const parent of structure.timelines.values()) {
    const displayByDepth = new Map();
    for (const event of parent.events || []) {
      if (event.kind === "removal") {
        displayByDepth.delete(event.removal.depth);
        continue;
      }
      const {placement} = event;
      const effectiveObjectId = placement.objectId
        || displayByDepth.get(placement.depth)
        || null;
      if (placement.objectId) displayByDepth.set(placement.depth, placement.objectId);
      if (!effectiveObjectId) continue;
      const timelineId = `sprite-${effectiveObjectId}`;
      if (!incomingParentIds.has(timelineId)) incomingParentIds.set(timelineId, new Set());
      incomingParentIds.get(timelineId).add(parent.timelineId);
    }
  }

  const accepted = [];
  const rejected = [];
  for (const timelineId of remaining) {
    const inventoryTimeline = inventoryByTimeline.get(timelineId);
    invariant(inventoryTimeline, `${animationId}/${timelineId}: inventory timeline is missing`);
    invariant(
      inventoryTimeline.structuralReachability
        === "reachable-from-root-placement-graph",
      `${animationId}/${timelineId}: timeline is not root-reachable`,
    );
    const sourceObjectId = String(inventoryTimeline.objectId ?? "");
    invariant(
      timelineId === `sprite-${sourceObjectId}`,
      `${animationId}/${timelineId}: object identity mismatch`,
    );
    const timeline = structure.timelines.get(timelineId);
    invariant(timeline, `${animationId}/${timelineId}: swfmill timeline is missing`);
    invariant(
      String(timeline.objectId) === sourceObjectId
        && timeline.declaredFrames === inventoryTimeline.frameCount
        && timeline.observedShowFrames === inventoryTimeline.frameCount,
      `${animationId}/${timelineId}: source frame census mismatch`,
    );
    invariant(
      !declaredTimelineIds.has(timelineId),
      `${animationId}/${timelineId}: remaining timeline is already declared`,
    );
    const directDoActionTagCount = timeline.tagCounts.DoAction || 0;
    const directDoInitActionTagCount = timeline.tagCounts.DoInitAction || 0;
    const ffdecFrameScripts = scripts.blocks
      .filter((block) => (
        block.scope.kind === "sprite"
        && block.scope.objectId === sourceObjectId
      ))
      .sort((left, right) => (
        left.scope.frame - right.scope.frame
        || compareText(left.script, right.script)
      ));
    const scriptFramesValid = ffdecFrameScripts.every((block) => (
      Number.isInteger(block.scope.frame)
      && block.scope.frame >= 1
      && block.scope.frame <= timeline.declaredFrames
      && SHA256_PATTERN.test(block.bodySha256)
    ));
    const nonemptyScriptCount = ffdecFrameScripts.filter(
      ({body}) => body.trim().length > 0,
    ).length;
    const swfmillDoActionFrameSequence = frameSequenceContract(
      (timeline.doActions || []).map(({frame}) => frame),
    );
    const ffdecFrameScriptFrameSequence = frameSequenceContract(
      ffdecFrameScripts.map(({scope}) => scope.frame),
    );
    const exactActionCountParity = (
      directDoActionTagCount > 0
      && directDoActionTagCount === ffdecFrameScripts.length
      && directDoActionTagCount === swfmillDoActionFrameSequence.count
    );
    const exactActionFrameSequenceParity = (
      exactActionCountParity
      && swfmillDoActionFrameSequence.sha256
        === ffdecFrameScriptFrameSequence.sha256
      && JSON.stringify(swfmillDoActionFrameSequence.frames)
        === JSON.stringify(ffdecFrameScriptFrameSequence.frames)
    );
    const exactActionExportParity = (
      exactActionFrameSequenceParity
      && scriptFramesValid
      && nonemptyScriptCount > 0
    );
    const parentTimelineIds = [...(incomingParentIds.get(timelineId) || [])]
      .sort(compareTimelineIds);
    const priorDisqualifiers = [
      ...(priorDisqualifiersByTimeline.get(timelineId) || []),
    ];
    const common = {
      timelineId,
      sourceObjectId,
      frameCount: timeline.declaredFrames,
      parentTimelineIds,
      priorDisqualifiers,
      sourceProof: {
        declaredFrameCount: timeline.declaredFrames,
        observedShowFrameCount: timeline.observedShowFrames,
        exactTagCensus: normalizedTagCensus(timeline.tagCounts),
        directDoActionTagCount,
        directDoInitActionTagCount,
        ffdecFrameScriptCount: ffdecFrameScripts.length,
        nonemptyFfdecFrameScriptCount: nonemptyScriptCount,
        swfmillDoActionFrames: swfmillDoActionFrameSequence.frames,
        ffdecFrameScriptFrames: ffdecFrameScriptFrameSequence.frames,
        swfmillDoActionFrameSequenceSha256:
          swfmillDoActionFrameSequence.sha256,
        ffdecFrameScriptFrameSequenceSha256:
          ffdecFrameScriptFrameSequence.sha256,
        localActionFrameSequenceEncoding:
          swfmillDoActionFrameSequence.encoding,
        exactDoActionToFfdecFrameScriptCount: exactActionCountParity,
        exactDoActionToFfdecFrameSequence:
          exactActionFrameSequenceParity,
        allFrameScriptCoordinatesWithinLocalDomain: scriptFramesValid,
        frameScripts: ffdecFrameScripts.map(normalizedFrameScript),
      },
    };
    if (timeline.declaredFrames > 1 && exactActionExportParity) {
      accepted.push({
        ...common,
        disposition: "independent-required",
        role: SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE,
        claimScope: "separate-local-frame-action-domain-required",
        sourceConclusion:
          "The exact multi-frame child contains source-authored DoAction state at one-indexed local frames. A containing root/parent frame alone cannot exhaustively identify those local action states, so the child must be declared and specified as its own frame domain before strict acceptance.",
        preservedObligations: {
          naturalRuntimeReachability: "pending",
          actionSemantics: "pending",
          interaction: "pending",
          visual: "pending",
          audio: "pending",
          fullFrameRmse: "pending",
          humanReview: "pending",
          ownerAcceptance: "pending",
        },
      });
    } else {
      rejected.push({
        ...common,
        disposition: "unresolved",
        ...rejectedClassification({
          frameCount: timeline.declaredFrames,
          directDoActionTagCount,
          exactActionCountParity,
          exactActionFrameSequenceParity,
          ffdecFrameScripts,
          parentTimelineId:
            parentTimelineIds.length === 1 ? parentTimelineIds[0] : null,
          priorDisqualifiers,
        }),
      });
    }
  }
  return {
    remainingTimelineIds: remaining,
    accepted,
    rejected,
    acceptedTimelineIds: accepted.map(({timelineId}) => timelineId),
    rejectedTimelineIds: rejected.map(({timelineId}) => timelineId),
  };
}

export function validateSourceProvenIndependentEvidenceDocument(document, {
  animationId,
  sourceSwf,
  scenarioInventory,
  migrationTechnicalProjection,
  swfmillStructure,
  ffdecScripts,
} = {}) {
  const label = `${animationId}: source-proven independent evidence`;
  invariant(document?.schemaVersion === 1, `${label}: schemaVersion is invalid`);
  invariant(
    document.evidenceType === "source-proven-independent-frame-domain-evidence",
    `${label}: evidenceType is invalid`,
  );
  invariant(document.status === "verified-source-obligation", `${label}: status is invalid`);
  invariant(document.animationId === animationId, `${label}: animation identity mismatch`);
  invariant(document.migrationStatusChanged === false, `${label}: migration status changed`);
  invariant(
    document.generatedBy?.proofEngine?.path
      === "scripts/source-proven-independent-frame-domain-evidence.mjs"
      && SHA256_PATTERN.test(
        document.generatedBy?.proofEngine?.sha256 || "",
      ),
    `${label}: proof-engine binding is invalid`,
  );
  invariant(
    String(document.strictAcceptanceEffect || "").startsWith("none;"),
    `${label}: strict acceptance boundary was crossed`,
  );
  for (const [key, expected] of [
    ["sourceSwf", sourceSwf],
    ["scenarioInventory", scenarioInventory],
    ["migrationTechnicalProjection", migrationTechnicalProjection],
    ["swfmillStructure", swfmillStructure],
    ["ffdecScripts", ffdecScripts],
  ]) {
    const actual = document.generatedFrom?.[key];
    invariant(actual && expected, `${label}: ${key} binding is missing`);
    for (const property of Object.keys(expected)) {
      invariant(
        actual[property] === expected[property],
        `${label}: ${key}.${property} binding drifted`,
      );
    }
  }
  invariant(Array.isArray(document.claims), `${label}: claims must be an array`);
  invariant(Array.isArray(document.rejected), `${label}: rejected must be an array`);
  const claimIds = exactTimelineSet(
    document.claims.map(({timelineId}) => timelineId),
    `${label}: claim timeline set`,
  );
  const rejectedIds = exactTimelineSet(
    document.rejected.map(({timelineId}) => timelineId),
    `${label}: rejected timeline set`,
  );
  invariant(
    !claimIds.some((timelineId) => rejectedIds.includes(timelineId)),
    `${label}: accepted/rejected sets overlap`,
  );
  invariant(
    document.summary?.remainingBefore === claimIds.length + rejectedIds.length
      && document.summary?.independentRequired === claimIds.length
      && document.summary?.unresolvedAfter === rejectedIds.length,
    `${label}: summary count drifted`,
  );
  invariant(
    document.exactPairSets?.accepted?.count === claimIds.length
      && SHA256_PATTERN.test(document.exactPairSets?.accepted?.sha256 || "")
      && document.exactPairSets?.rejected?.count === rejectedIds.length
      && SHA256_PATTERN.test(document.exactPairSets?.rejected?.sha256 || ""),
    `${label}: pair-set binding is invalid`,
  );
  for (const claim of document.claims) {
    const scripts = claim.sourceProof?.frameScripts || [];
    const scriptNames = scripts.map(({script}) => script);
    const nonemptyScriptCount = scripts.filter(
      ({bodyNonempty}) => bodyNonempty === true,
    ).length;
    const swfmillFrames = claim.sourceProof?.swfmillDoActionFrames || [];
    const ffdecFrames = claim.sourceProof?.ffdecFrameScriptFrames || [];
    const swfmillSequence = frameSequenceContract(swfmillFrames);
    const ffdecSequence = frameSequenceContract(ffdecFrames);
    invariant(
      claim.disposition === "independent-required"
        && claim.role === SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE
        && claim.claimScope === "separate-local-frame-action-domain-required"
        && Number.isInteger(claim.frameCount)
        && claim.frameCount > 1
        && claim.sourceProof?.declaredFrameCount === claim.frameCount
        && claim.sourceProof?.observedShowFrameCount === claim.frameCount
        && claim.sourceProof?.directDoActionTagCount > 0
        && claim.sourceProof.directDoActionTagCount === scripts.length
        && claim.sourceProof.ffdecFrameScriptCount === scripts.length
        && claim.sourceProof.nonemptyFfdecFrameScriptCount > 0
        && claim.sourceProof.nonemptyFfdecFrameScriptCount
          === nonemptyScriptCount
        && claim.sourceProof.exactDoActionToFfdecFrameScriptCount === true
        && claim.sourceProof.exactDoActionToFfdecFrameSequence === true
        && claim.sourceProof.localActionFrameSequenceEncoding
          === swfmillSequence.encoding
        && claim.sourceProof.swfmillDoActionFrameSequenceSha256
          === swfmillSequence.sha256
        && claim.sourceProof.ffdecFrameScriptFrameSequenceSha256
          === ffdecSequence.sha256
        && swfmillSequence.count === scripts.length
        && ffdecSequence.count === scripts.length
        && swfmillSequence.sha256 === ffdecSequence.sha256
        && JSON.stringify(swfmillFrames) === JSON.stringify(ffdecFrames)
        && JSON.stringify(ffdecFrames)
          === JSON.stringify(scripts.map(({frame}) => frame))
        && claim.sourceProof.allFrameScriptCoordinatesWithinLocalDomain === true
        && scripts.every((script) => (
          Number.isInteger(script.frame)
          && script.frame >= 1
          && script.frame <= claim.frameCount
          && SHA256_PATTERN.test(script.bodySha256 || "")
          && Number.isInteger(script.bodyBytes)
          && script.bodyBytes >= 0
          && typeof script.bodyNonempty === "boolean"
          && script.script.startsWith(
            `DefineSprite_${claim.sourceObjectId}`,
          )
          && script.script.includes(`/frame_${script.frame}/`)
        )),
      `${label}/${claim.timelineId}: independent-required proof is incomplete`,
    );
    invariant(
      new Set(scriptNames).size === scriptNames.length
        && claim.sourceProof?.exactTagCensus?.DoAction
          === claim.sourceProof.directDoActionTagCount
        && claim.sourceProof?.exactTagCensus?.ShowFrame === claim.frameCount
        && claim.sourceProof?.exactTagCensus?.End === 1,
      `${label}/${claim.timelineId}: exact tag/script census is incomplete`,
    );
    invariant(
      Object.values(claim.preservedObligations || {}).every(
        (status) => status === "pending",
      ),
      `${label}/${claim.timelineId}: a preserved obligation was promoted`,
    );
  }
  invariant(
    document.rejected.every((item) => (
      item.disposition === "unresolved"
      && typeof item.blockerClass === "string"
      && item.blockerClass.length > 0
      && typeof item.nextEvidenceAction === "string"
      && item.nextEvidenceAction.length > 0
    )),
    `${label}: rejected timeline lacks a fail-closed blocker/action`,
  );
  invariant(
    document.acceptanceEffects
      && Object.keys(document.acceptanceEffects).length > 0
      && Object.values(document.acceptanceEffects).every(
        (accepted) => accepted === false,
      ),
    `${label}: acceptance effects must all remain false`,
  );
  return true;
}
