import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

import {
  CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
  isClerkSyntheticFailurePhase,
  type ClerkSyntheticFailurePhase,
} from '../lib/clerk-synthetic-execution';

function writeFixedRecord(record: string) {
  process.stdout.write(`${record}\n`);
}

/**
 * Intentionally ignores titles, steps, parameters, errors, stdout, stderr,
 * attachments, paths, URLs, and provider diagnostics. The parent launcher
 * accepts only these fixed records and never forwards raw child output.
 */
export default class ClerkSyntheticRedactedReporter implements Reporter {
  private failurePhaseContractInvalid = false;
  private readonly failurePhases: ClerkSyntheticFailurePhase[] = [];
  private globalErrorObserved = false;

  printsToStdio() {
    return true;
  }

  onBegin(_config: FullConfig, suite: Suite) {
    writeFixedRecord(`CLERK_SYNTHETIC_TEST_COUNT=${suite.allTests().length}`);
  }

  onError() {
    if (this.globalErrorObserved) return;
    this.globalErrorObserved = true;
    writeFixedRecord('CLERK_SYNTHETIC_GLOBAL_ERROR=REDACTED');
  }

  onTestEnd(_test: TestCase, result: TestResult) {
    const status = result.status === 'passed'
      ? 'PASS'
      : result.status === 'skipped'
        ? 'SKIP'
        : 'FAIL';
    const phaseAnnotations = result.annotations.filter(
      (annotation) =>
        annotation.type === CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
    );
    if (status === 'FAIL') {
      if (
        phaseAnnotations.length !== 1
        || !isClerkSyntheticFailurePhase(
          phaseAnnotations[0]?.description,
        )
      ) {
        this.failurePhaseContractInvalid = true;
      } else {
        this.failurePhases.push(phaseAnnotations[0].description);
      }
    } else if (phaseAnnotations.length !== 0) {
      this.failurePhaseContractInvalid = true;
    }
    writeFixedRecord(`CLERK_SYNTHETIC_TEST_STATUS=${status}`);
  }

  onEnd(result: FullResult) {
    const underlyingStatus = result.status === 'passed'
      ? 'PASS'
      : result.status === 'interrupted'
        ? 'INTERRUPTED'
        : 'FAIL';
    const phaseContractFailed = underlyingStatus === 'PASS'
      ? this.globalErrorObserved
        || this.failurePhaseContractInvalid
        || this.failurePhases.length !== 0
      : this.globalErrorObserved
        || this.failurePhaseContractInvalid
        || this.failurePhases.length !== 1;
    const status = underlyingStatus === 'PASS' && !phaseContractFailed
      ? 'PASS'
      : underlyingStatus === 'INTERRUPTED'
        ? 'INTERRUPTED'
        : 'FAIL';
    if (status !== 'PASS') {
      const phase = phaseContractFailed
        ? 'UNKNOWN_REDACTED'
        : this.failurePhases[0]!;
      writeFixedRecord(`CLERK_SYNTHETIC_FAILURE_PHASE=${phase}`);
    }
    writeFixedRecord(`CLERK_SYNTHETIC_RESULT=${status}`);
  }
}
