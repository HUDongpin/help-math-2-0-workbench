import copy
import importlib.util
import json
from pathlib import Path
import unittest

SPEC = importlib.util.spec_from_file_location('compiler', Path(__file__).with_name('build-ts008-teaching-behavior.py'))
compiler = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(compiler)


class SourceBoundBehaviorTests(unittest.TestCase):
    def setUp(self):
        self.ir = json.loads(compiler.IR.read_text())

    def test_current_description_matches_raw_source_and_generated_output(self):
        self.assertEqual(compiler.generate(self.ir), compiler.OUTPUT.read_text())

    def test_changed_answer_is_rejected_by_source_handler_not_generated_code(self):
        self.ir['input']['choices'][0]['result'] = 'right'
        with self.assertRaisesRegex(ValueError, 'answer contradicts source'):
            compiler.validate(self.ir)

    def test_swapping_button_identity_cannot_change_the_answer(self):
        self.ir['input']['choices'][0]['buttonObjectId'] = 157
        with self.assertRaisesRegex(ValueError, 'placement mismatch'):
            compiler.validate(self.ir)

    def test_retry_limit_must_match_source_counter_condition(self):
        self.ir['feedback']['wrongAttemptLimit'] = 3
        with self.assertRaisesRegex(ValueError, 'retry limit contradicts source'):
            compiler.validate(self.ir)

    def test_source_or_extraction_drift_fails_before_generation(self):
        for field in ['source', 'scripts', 'structure']:
            changed = copy.deepcopy(self.ir)
            changed[field]['sha256'] = '0' * 64
            with self.assertRaisesRegex(ValueError, 'hash drift'):
                compiler.validate(changed)

    def test_replay_cannot_omit_a_state_variable(self):
        del self.ir['replay']['initialState']['wrongTryCount']
        with self.assertRaisesRegex(ValueError, 'complete admitted state vector'):
            compiler.validate(self.ir)

    def test_unresolved_audio_cannot_be_silently_enabled(self):
        self.ir['audio'][0].update(status='resolved', asset='invented.mp3', completionGate='ended')
        with self.assertRaisesRegex(ValueError, 'audio execution is not admitted'):
            compiler.validate(self.ir)

    def test_unknown_event_or_early_completion_is_rejected(self):
        for field, key, value in [('input', 'event', 'hover'), ('completion', 'phase', 'feedback')]:
            changed = copy.deepcopy(self.ir)
            changed[field][key] = value
            with self.assertRaisesRegex(ValueError, 'unsupported'):
                compiler.validate(changed)

    def test_unknown_effects_are_rejected_instead_of_silently_ignored(self):
        self.ir['feedback']['effects'] = ['play-invented-audio', 'award-score']
        with self.assertRaisesRegex(ValueError, 'unsupported or missing feedback fields'):
            compiler.validate(self.ir)


if __name__ == '__main__':
    unittest.main()
