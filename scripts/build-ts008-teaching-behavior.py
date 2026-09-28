#!/usr/bin/env python3
"""Compile only TS008's admitted quiz/replay contract, checking raw extraction.

This is not an ActionScript interpreter. Unknown contracts and unresolved audio
execution fail closed; existing walkthrough/help adapters remain separate.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
IR = ROOT / 'migrations/course-g04-l03-ts-008/audit/teaching-behavior-ir.json'
OUTPUT = ROOT / 'packages/demos/src/timelines/course-g04-l03-ts-008-behavior.generated.ts'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate(ir, root=ROOT):
    fields = {
        'input': {'event', 'enabledPhase', 'choices'},
        'feedback': {'phase', 'blocksFurtherChoices', 'completeEvent', 'rightDestination',
                     'wrongAttemptLimit', 'wrongRetryDestination', 'sourceEndHandlers',
                     'rightEndHandlers', 'randomSelection'},
        'replay': {'event', 'authority', 'seedPolicy', 'initialState'},
        'completion': {'phase', 'frame', 'notification', 'requiresControlsReady', 'authority', 'note'},
    }
    require(set(ir) == {'schemaVersion', 'animationId', 'scope', 'source', 'scripts',
        'structure', 'input', 'feedback', 'audio', 'replay', 'completion', 'unresolved',
        'acceptanceEffect'}, 'unsupported or missing IR fields')
    for field, keys in fields.items():
        require(set(ir[field]) == keys, f'unsupported or missing {field} fields')
    for choice in ir['input']['choices']:
        require(set(choice) == {'id', 'sourceInstance', 'buttonObjectId', 'result'}, 'unsupported choice fields')
    for cue in ir['audio']:
        require(set(cue) == {'state', 'status', 'asset', 'completionGate', 'reason'}, 'unsupported audio fields')
    require(ir['schemaVersion'] == 1 and ir['animationId'] == 'course-g04-l03-ts-008', 'unsupported IR identity/version')
    raw = {}
    for key in ('source', 'scripts', 'structure'):
        binding = ir[key]
        path = (root / binding['path']).resolve()
        require(path.is_relative_to(root.resolve()), 'binding outside repository')
        raw[key] = path.read_bytes()
        require(hashlib.sha256(raw[key]).hexdigest() == binding['sha256'], f'{key} hash drift')
    require(ir['source']['sha256'] == '9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885',
            'source is outside the admitted TS008 binary')
    parts = re.split(r'^===== (.+?) =====\n', gzip.decompress(raw['scripts']).decode(), flags=re.M)
    require(len(parts[1::2]) == len(set(parts[1::2])), 'duplicate source script identities')
    scripts = dict(zip(parts[1::2], parts[2::2]))
    movie = ET.fromstring(gzip.decompress(raw['structure']))
    sprites = [e for e in movie.iter('DefineSprite') if e.get('objectID') == '350']
    require(len(sprites) == 1, 'missing/ambiguous sprite-350')
    inputs = ir['input']
    require(inputs['event'] == 'choose' and inputs['enabledPhase'] == 'quiz', 'unsupported input contract')
    require([c['id'] for c in inputs['choices']] == list('ABCD'), 'unsupported choice set')
    for index, choice in enumerate(inputs['choices'], 1):
        require(choice['sourceInstance'] == f'AnsBtn{index}', 'choice instance order mismatch')
        placements = {e.get('objectID') for e in sprites[0].iter('PlaceObject2') if e.get('name') == choice['sourceInstance']}
        require(placements == {str(choice['buttonObjectId'])}, 'choice placement mismatch')
        handler = scripts[f"DefineButton2_{choice['buttonObjectId']}/BUTTONCONDACTION on(release).as"]
        outcomes = re.findall(r'_root\.show(Right|Wrong)Feed\(\)', handler)
        require(outcomes == [choice['result'].capitalize()], 'answer contradicts source handler')
        require('_root.disableQuizButton();' in handler, 'missing source input lock')
    feedback = ir['feedback']
    require(feedback['phase'] == 'feedback' and feedback['blocksFurtherChoices'] is True
            and feedback['completeEvent'] == 'feedback-complete'
            and feedback['rightDestination'] == 'terminal'
            and feedback['wrongRetryDestination'] == 'quiz', 'unsupported transition contract')
    require(feedback['sourceEndHandlers'] == [
        'DefineSprite_197/frame_28/DoAction.as', 'DefineSprite_208/frame_28/DoAction.as',
        'DefineSprite_232/frame_31/DoAction.as'], 'wrong feedback domain mismatch')
    for name in feedback['sourceEndHandlers']:
        handler = scripts[name]
        limit = re.search(r'quizTryCount >= (\d+)', handler)
        require(limit and int(limit[1]) == feedback['wrongAttemptLimit'] == 2, 'retry limit contradicts source')
        require(all(x in handler for x in ['quizTryCount++;', 'quizTryCount = 0;', '_parent.play();']), 'missing retry/reset/continuation evidence')
    require(set(feedback['rightEndHandlers']) == {
        'DefineSprite_284/frame_27/DoAction.as', 'DefineSprite_300/frame_28/DoAction.as',
        'DefineSprite_312/frame_25/DoAction.as', 'DefineSprite_324/frame_28/DoAction.as'}, 'right feedback domain mismatch')
    for name in feedback['rightEndHandlers']:
        require('_parent.play();' in scripts[name], 'missing correct continuation')
    initial = ir['replay']['initialState']
    require(initial == dict(phase='walkthrough', walkthroughGate=0, walkthroughBoxRevealed=False,
        frame=328, wrongTryCount=0, selectedChoiceId=None, feedback=None,
        focusTarget='walkthrough-step-1', needMoreHelpReturnPhase=None, needMoreHelpReturnFocus=None),
        'Replay must reset the complete admitted state vector')
    require(ir['replay']['event'] == 'replay' and ir['replay']['authority'] == 'modern-product-contract', 'unsupported Replay contract')
    require(ir['replay']['seedPolicy'] == 'normalize supplied seed or retain current seed', 'unsupported Replay seed contract')
    require('stop();' in scripts['DefineSprite_350/frame_328/DoAction.as'], 'missing initial source stop')
    completion = ir['completion']
    require(completion['phase'] == 'terminal' and completion['frame'] == 789
        and completion['notification'] == 'onActivityComplete' and completion['requiresControlsReady'] is True,
        'unsupported completion adapter')
    require('stop();' in scripts['DefineSprite_350/frame_789/DoAction.as'], 'missing terminal source stop')
    require(len(ir['audio']) == 1 and ir['audio'][0]['state'] == 'feedback'
        and ir['audio'][0]['status'] == 'unresolved' and ir['audio'][0]['asset'] is None
        and ir['audio'][0]['completionGate'] == 'not-used', 'audio execution is not admitted by this compiler')
    require(ir['acceptanceEffect'] == 'none', 'IR cannot promote acceptance')


def generate(ir):
    validate(ir)
    body = json.dumps(ir, indent=2, ensure_ascii=False)
    return ('// Generated by scripts/build-ts008-teaching-behavior.py; do not edit.\n'
            '// Source checks and modern product decisions remain distinct.\n'
            '''import {twoAttemptFeedbackDestination} from "./practice-question-feedback";
export const TS008_BEHAVIOR = ''' + body + ''' as const;
export const isTS008CorrectChoice = (id: string): boolean =>
  TS008_BEHAVIOR.input.choices.some((choice) => choice.id === id && choice.result === "right");
export const ts008FeedbackDestination = (kind: "right" | "wrong", wrongTryCount: 0 | 1) =>
  twoAttemptFeedbackDestination(kind, wrongTryCount) === "terminal"
    ? TS008_BEHAVIOR.feedback.rightDestination
    : TS008_BEHAVIOR.feedback.wrongRetryDestination;
''')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    output = generate(json.loads(IR.read_text()))
    if args.check:
        require(OUTPUT.read_text() == output, 'generated behavior config is stale')
    else:
        OUTPUT.write_text(output)
    print('TS008 source-bound behavior config verified' if args.check else 'TS008 behavior config generated')


if __name__ == '__main__':
    main()
