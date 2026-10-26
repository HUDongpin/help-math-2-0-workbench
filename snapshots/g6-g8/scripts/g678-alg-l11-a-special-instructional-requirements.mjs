// Source-only requirement correction. This is not product/browser admission.
export const SPECIAL3_SOURCE_MANIFEST = Object.freeze({
  path: 'work/g678-shared-page-factory/g678-alg-l11-a-special-instructional-visuals-v2/manifest.json',
  bytes: 12819,
  sha256: 'd1daafb416c645730376b420b433d90e28c7dcaa02304491a8be91487ede44c3',
});
const TERMS = Object.freeze({
  6: ['greater-than', 'inequality', 'less-than', 'sentence', 'symbol'],
  9: ['change', 'direction', 'inequality', 'negative-number', 'reverse', 'solve', 'symbol'],
  10: ['direction', 'inequality', 'negative-number', 'reverse', 'solve', 'symbol'],
});
export function special3RequiredInstructionalComponents(animationId) {
  const number = Number(animationId.slice(-3));
  if (!TERMS[number] || animationId !== `shared-alg001-l11-p${String(number).padStart(3, '0')}`) return null;
  return [...(number === 6 ? ['question', 'answer-option-depth-6',
    'answer-option-depth-24', 'answer-option-depth-26', 'wrong-feedback',
    'wrong-feedback-close', 'right-feedback'] :
    [`linear-teaching-sequence-1-${number === 9 ? 431 : 394}`,
      `terminal-instruction-frame-${number === 9 ? 431 : 394}`]),
  ...TERMS[number].map((term) => `glossary-${term}`)];
}
const exact = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function assert(value, message) {
  if (!value) throw new Error(`BLOCKED_SOURCE_REQUIREMENTS_DRIFT: ${message}`);
}

// The caller supplies physically rehashed, manifest-bound extracted scripts;
// neither config booleans nor a synthetic "passed" record establishes entry.
export function assertSpecial3SourceFacts(config, scripts) {
  const number = Number(config.animationId?.slice(-3));
  assert(TERMS[number] && exact(config.glossaryEntries?.map((entry) => entry.id), TERMS[number]), 'exact glossary source entries');
  assert(exact(scripts.map((file) => file.path), config.sourceScripts?.map((file) => file.path)), 'complete script inventory');
  assert(scripts.length === ({6: 24, 9: 14, 10: 13})[number], 'source script count');
  const joined = scripts.map((file) => file.text).join('\n');
  const sourceMainScripts = scripts.filter((file) => file.path.includes(`/DefineSprite_${config.mainObjectId}/`));
  if (number === 6) {
    assert(config.kind === 'source-three-hit-inequality-choice' &&
      exact([config.mainObjectId, config.frameCount, config.quizFrame, config.resumeFrame, config.terminalFrame], [50, 53, 24, 25, 53]), 'p006 source timeline');
    assert(exact(config.answers?.map(({depth, label, correct}) => ({depth, label, correct})), [
      {depth: 6, label: 'x ≥ 5', correct: true}, {depth: 24, label: '10y⁵', correct: false},
      {depth: 26, label: 'x + 10 = 15', correct: false}]), 'p006 exact three source choices');
    assert(config.sourceSemanticCorrection?.equalityUnderlineShapeId === 20 &&
      config.sourceSemanticCorrection.sourceVectorProjection === 'x ≥ 5', 'p006 source equality underline');
    assert(sourceMainScripts.filter((file) => file.path.includes('CLIPACTIONRECORD')).length === 3 &&
      config.feedback?.wrong?.sourceObjectId === 48 && config.feedback.right?.sourceObjectId === 28 &&
      config.feedback.wrong.frameBodies.length === 20 && config.feedback.right.frameBodies.length === 20,
    'p006 actual click and feedback domains');
    assert(config.audioLabelDomain?.sourceObjectId === 30 &&
      exact(config.audioLabelDomain.windows.map(({label, startFrame, returnFrame}) => [label, startFrame, returnFrame]),
        [['S1', 3, 16], ['S2', 18, 27], ['S3', 31, 36], ['S4', 40, 54]]) &&
      !/Coach_audio_1\s*\.\s*(?:gotoAndPlay|play)\s*\(/u.test(joined), 'p006 dormant audio local entry');
  } else {
    const main = number === 9 ? 65 : 75;
    assert(config.kind === 'source-linear-teaching-with-glossary' &&
      config.mainObjectId === main && config.frameCount === (number === 9 ? 431 : 394) &&
      exact(config.interactiveStops, []) && !config.answers && !config.feedback &&
      sourceMainScripts.length === 0 && !/Mc_Wrong_Feed3\s*\.\s*(?:gotoAndPlay|play)\s*\(/u.test(joined),
    'linear teaching has no source-local quiz entry');
    assert(config.dormantFeedbackDisposition?.sourceObjectId === (number === 9 ? 43 : 58) &&
      config.dormantFeedbackDisposition.sourceFrameCount === 70 &&
      config.dormantFeedbackDisposition.needMoreHelpPlacementCount === 0,
    'dormant feedback is not an active question/help requirement');
  }
  return true;
}

export async function loadSpecial3RequirementSources(readBound) {
  const manifest = JSON.parse((await readBound(SPECIAL3_SOURCE_MANIFEST.path, SPECIAL3_SOURCE_MANIFEST)).buffer);
  for (const file of [manifest.sourceAudit, manifest.glossaryAudit, manifest.sourceVectorManifest,
    manifest.builder, manifest.normalizer, ...manifest.files]) await readBound(file.path, file);
  const corrections = [];
  for (const member of manifest.members) {
    const config = JSON.parse((await readBound(member.config.path, member.config)).buffer);
    const scripts = [];
    for (const file of config.sourceScripts) scripts.push({path: file.path,
      text: (await readBound(file.path, file)).buffer.toString('utf8')});
    await readBound(config.sourceXml.path, config.sourceXml);
    await readBound(config.mainVectorBundle.path, config.mainVectorBundle);
    assertSpecial3SourceFacts(config, scripts);
    corrections.push({animationId: config.animationId, sourceIdentityFromFrozenExtraction: config.source,
      sourceConfig: member.config, sourceXml: config.sourceXml, sourceScripts: config.sourceScripts,
      mainVectorBundle: config.mainVectorBundle, mainObjectId: config.mainObjectId,
      frameCount: config.frameCount, kind: config.kind,
      activeChoices: config.answers?.map(({depth, label, correct}) => ({depth, label, correct})) ?? [],
      requiredInstructionalComponents: special3RequiredInstructionalComponents(config.animationId),
      dormantSourceDomain: config.audioLabelDomain ?? config.dormantFeedbackDisposition,
      correction: config.answers
        ? 'One active three-hit inequality question, including shape20 equality underline; S1–S4 are placed/stopped audio domains without a source-local start, not four questions.'
        : 'The complete authored linear teaching timeline and glossary entries are active; the placed/stopped nested feedback has no source-local start or help placement. Do not fabricate quiz/help controls.',
    });
  }
  return {sourceManifest: SPECIAL3_SOURCE_MANIFEST, corrections};
}
