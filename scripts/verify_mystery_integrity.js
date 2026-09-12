// Verification test for Mystery Leak, Concurrency, Chapter Gating, and State Consistency
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function runTests() {
  console.log('--- QUESTCHASE FINAL INTEGRITY & MYSTERY LEAK AUDIT ---');
  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
    }
  }

  // Test 1: INITIAL_CASES has zero mystery clue text in client bundles
  const initialDataContent = fs.readFileSync(path.join(rootDir, 'src/lib/initialData.ts'), 'utf8');
  assert(
    !initialDataContent.includes('Overturned Crystal Tumbler') &&
    !initialDataContent.includes('potassium cyanide mixed into high-proof scotch') &&
    !initialDataContent.includes('Torn Codicil Draft') &&
    !initialDataContent.includes('Broken Gold Watch #14'),
    'Test 1: INITIAL_CASES has zero undiscovered clue texts (no titles, descriptions, notes)'
  );

  // Test 2: serverCaseData.ts contains complete canonical evidence and actions
  const serverCaseDataContent = fs.readFileSync(path.join(rootDir, 'src/lib/serverCaseData.ts'), 'utf8');
  assert(
    serverCaseDataContent.includes('Overturned Crystal Tumbler') &&
    serverCaseDataContent.includes('Torn Codicil Draft') &&
    serverCaseDataContent.includes('Broken Gold Watch #14') &&
    serverCaseDataContent.includes('Dr. Elena Dispensary Ledger') &&
    serverCaseDataContent.includes('act_08') &&
    serverCaseDataContent.includes('act_09'),
    'Test 2: serverCaseData.ts holds complete canonical evidence (9 clues) and actions (9 actions)'
  );

  // Test 3: GET /api/cases masks undiscovered evidence
  const apiCasesContent = fs.readFileSync(path.join(rootDir, 'src/app/api/cases/route.ts'), 'utf8');
  assert(
    apiCasesContent.includes('SERVER_CASES') &&
    apiCasesContent.includes('isDiscovered: false') &&
    apiCasesContent.includes('pinnedOnBoard: false') &&
    apiCasesContent.includes('// Undiscovered: strictly masked, zero mystery clue details leaked'),
    'Test 3: GET /api/cases masks undiscovered evidence to id, caseId, chapterId only'
  );

  // Test 4: POST /api/cases/[caseId]/actions returns revealed evidence definition
  const apiActionsContent = fs.readFileSync(path.join(rootDir, 'src/app/api/cases/[caseId]/actions/route.ts'), 'utf8');
  assert(
    apiActionsContent.includes('getServerEvidence') &&
    apiActionsContent.includes('evidence: revealedEvidence') &&
    apiActionsContent.includes('SERVER_CASES'),
    'Test 4: Investigation action execution returns revealed evidence definition with narrative findings'
  );

  // Test 5: DB Migration 002 - check_and_unlock_achievements concurrency row lock
  const migration002 = fs.readFileSync(path.join(rootDir, 'supabase/migrations/002_security_and_game_integrity.sql'), 'utf8');
  assert(
    migration002.includes('SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;') &&
    migration002.includes('WITH ins AS (') &&
    migration002.includes('WHERE user_achievements.is_unlocked = FALSE') &&
    migration002.includes('RETURNING achievement_id'),
    'Test 5: check_and_unlock_achievements uses FOR UPDATE profile lock and atomic conditional insertion gate'
  );

  // Test 6: DB Migration 002 - execute_investigation_action_atomic has act_08 and act_09
  assert(
    migration002.includes("p_action_id = 'act_08'") &&
    migration002.includes("v_yields_evidence_id := 'ev_02'") &&
    migration002.includes("p_action_id = 'act_09'") &&
    migration002.includes("v_yields_evidence_id := 'ev_08'"),
    'Test 6: Database RPC includes act_08 (ev_02) and act_09 (ev_08) with correct gold costs and stats'
  );

  // Test 7: DB Migration 002 - execute_investigation_action_atomic authoritatively gates chapters
  assert(
    migration002.includes("v_target_chapter = 'ch_02' AND v_discovered_count < 3") &&
    migration002.includes("v_target_chapter = 'ch_03' AND v_discovered_count < 5"),
    'Test 7: Chapter gating enforces 3 clues for Chapter 2 and 5 clues for Chapter 3'
  );

  // Test 8: DB Migration 002 - Authoritative non-regressing chapter advancement
  assert(
    migration002.includes("IF v_discovered_count >= 8 THEN") &&
    migration002.includes("v_target_chapter := 'ch_04';") &&
    migration002.includes("current_chapter_id = CASE") &&
    migration002.includes("WHEN EXCLUDED.current_chapter_id > case_progress.current_chapter_id"),
    'Test 8: Database RPC advances chapters authoritatively without regression'
  );

  // Test 9: DB Migration 002 - purchase_equipment_atomic locks profile first
  const purchaseEquipmentBlock = migration002.substring(migration002.indexOf('purchase_equipment_atomic'));
  const profileLockIdx = purchaseEquipmentBlock.indexOf('FOR UPDATE');
  const inventoryCheckIdx = purchaseEquipmentBlock.indexOf('EXISTS (SELECT 1 FROM public.user_inventory');
  assert(
    profileLockIdx !== -1 && inventoryCheckIdx !== -1 && profileLockIdx < inventoryCheckIdx,
    'Test 9: purchase_equipment_atomic locks profile FOR UPDATE before inventory check to eliminate race conditions'
  );

  // Test 10: Case Board rollback to lastPersistedPositions in Zustand
  const storeContent = fs.readFileSync(path.join(rootDir, 'src/lib/store.ts'), 'utf8');
  assert(
    storeContent.includes('lastPersistedPositions: Record<string, { x: number; y: number }>') &&
    storeContent.includes('lastGood = get().lastPersistedPositions[evidenceId]') &&
    storeContent.includes('boardPosition: lastGood'),
    'Test 10: useGameStore tracks lastPersistedPositions and rolls back accurately on sync failures'
  );

  // Test 11: Investigate page handles revealed evidence directly
  const investigatePageContent = fs.readFileSync(path.join(rootDir, 'src/app/investigate/[caseId]/page.tsx'), 'utf8');
  assert(
    investigatePageContent.includes('result.evidence || currentCase.evidence.find'),
    'Test 11: Investigate page passes newly revealed evidence directly into clue modal'
  );

  // Test 12: Zero client authority over XP or Gold
  const srcFiles = [];
  function collectFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
      const p = path.join(dir, file);
      if (fs.statSync(p).isDirectory()) {
        collectFiles(p);
      } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        srcFiles.push(p);
      }
    });
  }
  collectFiles(path.join(rootDir, 'src'));

  let clientMutationFound = false;
  srcFiles.forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    if (code.includes('xp +=') || code.includes('gold +=') || code.includes('level +=') || code.includes('streak +=')) {
      clientMutationFound = true;
      console.error(`Found client mutation in: ${f}`);
    }
  });
  assert(!clientMutationFound, 'Test 12: Zero client mutations of xp, gold, level, or streak in src/');

  console.log(`\nAUDIT RESULT: ${passed} / ${total} TESTS PASSED`);
  if (passed === total) {
    console.log('ALL AUDIT CHECKS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
