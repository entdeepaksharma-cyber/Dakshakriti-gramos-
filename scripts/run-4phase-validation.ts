import { INITIAL_STORE_STATE } from '../src/data/seedData';
import { runFourPhaseValidation } from '../src/utils/phaseValidationEngine';

const report = runFourPhaseValidation(INITIAL_STORE_STATE);

console.log('======================================================================');
console.log(`GRAMOS MART — 4-PHASE IMPLEMENTATION TEST SUITE (${report.projectCode})`);
console.log(`Executed At: ${report.executedAt}`);
console.log(
  `Summary: ${report.totalPassed}/${report.totalTests} PASS | ${report.totalActionGates} ACTION GATES | ${report.totalFailed} FAIL`
);
console.log('======================================================================');

for (const phase of report.phases) {
  console.log(`\n[${phase.phaseCode}] ${phase.phaseTitle}`);
  console.log(`  Pass: ${phase.passed} | Action Gates: ${phase.actionGates} | Fail: ${phase.failed}`);
  for (const t of phase.tests) {
    console.log(`  - [${t.status}] ${t.id} (${t.section}): ${t.title}`);
    console.log(`      Expected: ${t.expected}`);
    console.log(`      Actual:   ${t.actual}`);
  }
}

if (report.totalFailed > 0) {
  console.error(`\nFAILED: ${report.totalFailed} test(s) failed.`);
  process.exit(1);
}

console.log('\nALL 4 PHASES VALIDATED SUCCESSFULLY (0 FAILURES).');
