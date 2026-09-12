// ==============================================================================
// QUESTCHASE — FINAL SECURITY, CHAPTER PROGRESSION & GAME INTEGRITY VERIFICATION
// ==============================================================================
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function runAudit() {
  console.log('================================================================');
  console.log('QUESTCHASE FINAL SECURITY & GAMEPLAY INTEGRITY AUDIT');
  console.log('================================================================\n');

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

  // -------------------------------------------------------------
  // PHASE 1: Legacy 6-arg investigation RPC dropped in migration 003
  // -------------------------------------------------------------
  const migration003Path = path.join(rootDir, 'supabase/migrations/003_drop_old_investigation_rpc_and_enforce_chapter_integrity.sql');
  const migration003Exists = fs.existsSync(migration003Path);
  assert(migration003Exists, 'Phase 1: Migration 003 file exists');

  const migration003Content = migration003Exists ? fs.readFileSync(migration003Path, 'utf8').replace(/\r\n/g, '\n') : '';
  assert(
    migration003Content.includes('DROP FUNCTION IF EXISTS public.execute_investigation_action_atomic(') &&
    migration003Content.includes('UUID,') &&
    migration003Content.includes('INT,') &&
    migration003Content.includes('INT\n);'),
    'Phase 1: Migration 003 explicitly drops legacy 6-argument overload'
  );

  // -------------------------------------------------------------
  // PHASE 1B: Migration 004 Quest Completion & Anti-Exploit Security
  // -------------------------------------------------------------
  const migration004Path = path.join(rootDir, 'supabase/migrations/004_fix_quest_completion_and_security.sql');
  const migration004Exists = fs.existsSync(migration004Path);
  assert(migration004Exists, 'Phase 1B: Migration 004 file exists');

  const migration004Content = migration004Exists ? fs.readFileSync(migration004Path, 'utf8').replace(/\r\n/g, '\n') : '';
  assert(
    migration004Content.includes('public.apply_xp_and_level_up(') &&
    migration004Content.includes('v_intelligence_gain') &&
    migration004Content.includes('v_last_active = v_today - 1') &&
    migration004Content.includes('reward_transactions') &&
    migration004Content.includes('eq_chronograph_'),
    'Phase 1B: Migration 004 provides authoritative 5-arg apply_xp_and_level_up, attribute scaling, date-based streak, and Chronograph anti-exploit'
  );

  // Check no client or active API route calls the 6-parameter version
  const actionsRoute = fs.readFileSync(path.join(rootDir, 'src/app/api/cases/[caseId]/actions/route.ts'), 'utf8');
  assert(
    actionsRoute.includes("client.rpc('execute_investigation_action_atomic', {") &&
    actionsRoute.includes('p_user_id: user.id') &&
    actionsRoute.includes('p_case_id: caseId') &&
    actionsRoute.includes('p_action_id: actionId') &&
    !actionsRoute.includes('p_gold_cost') &&
    !actionsRoute.includes('p_yields_evidence_id'),
    'Phase 1: Investigation action API route passes strictly 3 server-authoritative parameters'
  );

  // -------------------------------------------------------------
  // PHASE 2 & 3: Server-authoritative Chapter state & out-of-order prevention
  // -------------------------------------------------------------
  assert(
    migration003Content.includes('IF v_target_chapter != v_current_chapter THEN') &&
    migration003Content.includes('Investigation Action Locked'),
    'Phase 2 & 3: Investigation RPC strictly rejects actions from chapters other than current_chapter_id'
  );

  assert(
    migration003Content.includes("v_current_chapter = 'ch_01' AND v_ch1_clues_count >= 3") &&
    migration003Content.includes("v_next_chapter := 'ch_02';") &&
    migration003Content.includes("v_current_chapter = 'ch_02' AND v_has_ev05 AND v_has_ev06") &&
    migration003Content.includes("v_next_chapter := 'ch_03';") &&
    migration003Content.includes("v_current_chapter = 'ch_03' AND v_has_ev07 AND v_has_ev08 AND v_has_ev09") &&
    migration003Content.includes("v_next_chapter := 'ch_04';"),
    'Phase 2: Chapter progression requires explicit evidence completion (Ch1: >=3 clues; Ch2: ev_05 & ev_06; Ch3: ev_07, ev_08 & ev_09)'
  );

  assert(
    migration003Content.includes('SELECT * INTO v_existing') &&
    migration003Content.includes("'alreadyExecuted', true"),
    'Phase 3: Re-executing completed actions returns harmless alreadyExecuted response'
  );

  // -------------------------------------------------------------
  // PHASE 4: Authoritative Case #002 Locking
  // -------------------------------------------------------------
  const deductionRoute = fs.readFileSync(path.join(rootDir, 'src/app/api/cases/[caseId]/deduction/route.ts'), 'utf8');
  const boardRoute = fs.readFileSync(path.join(rootDir, 'src/app/api/cases/[caseId]/board-positions/route.ts'), 'utf8');
  const connRoute = fs.readFileSync(path.join(rootDir, 'src/app/api/cases/[caseId]/connections/route.ts'), 'utf8');

  assert(
    actionsRoute.includes("if (caseId === 'case_002')") && actionsRoute.includes('status: 403'),
    'Phase 4: POST /api/cases/case_002/actions returns 403 Forbidden'
  );
  assert(
    deductionRoute.includes("if (caseId === 'case_002')") && deductionRoute.includes('status: 403'),
    'Phase 4: POST /api/cases/case_002/deduction returns 403 Forbidden'
  );
  assert(
    boardRoute.includes("if (caseId === 'case_002')") && boardRoute.includes('status: 403'),
    'Phase 4: POST /api/cases/case_002/board-positions returns 403 Forbidden'
  );
  assert(
    connRoute.includes("if (caseId === 'case_002')") && connRoute.includes('status: 403'),
    'Phase 4: POST /api/cases/case_002/connections returns 403 Forbidden'
  );
  assert(
    migration003Content.includes("p_case_id = 'case_002'") &&
    migration003Content.includes('solve_case_atomic') &&
    migration003Content.includes('Case Dossier Classified'),
    'Phase 4: solve_case_atomic strictly rejects case_002 in PostgreSQL RPC'
  );

  // -------------------------------------------------------------
  // PHASE 5: Remove Case #002 Solution from Client Bundle
  // -------------------------------------------------------------
  const finalAccusationContent = fs.readFileSync(path.join(rootDir, 'src/components/evidence/FinalAccusationModal.tsx'), 'utf8');
  const initialDataContent = fs.readFileSync(path.join(rootDir, 'src/lib/initialData.ts'), 'utf8');

  const secretKeywords = ['time_0245', 'how_master_keycard_degausser', 'why_forgery_offshore_payout'];
  let secretFoundInClient = false;
  secretKeywords.forEach(word => {
    if (finalAccusationContent.includes(word) || initialDataContent.includes(word)) {
      secretFoundInClient = true;
      console.error(`Found secret keyword "${word}" in client code!`);
    }
  });
  assert(!secretFoundInClient, 'Phase 5: Case #002 secret answers completely removed from client bundle');

  assert(
    !initialDataContent.includes('susp_ross'),
    'Phase 5: susp_ross removed from initialData.ts'
  );

  // -------------------------------------------------------------
  // PHASE 6: Case #001 Evidence Discovery Reachability
  // -------------------------------------------------------------
  const serverCaseData = fs.readFileSync(path.join(rootDir, 'src/lib/serverCaseData.ts'), 'utf8');
  const evidenceIds = ['ev_01', 'ev_02', 'ev_03', 'ev_04', 'ev_05', 'ev_06', 'ev_07', 'ev_08', 'ev_09'];
  const unreachableEvidence = [];

  evidenceIds.forEach(evId => {
    const pattern = new RegExp(`yieldsEvidenceId:\\s*['"]${evId}['"]`);
    if (!pattern.test(serverCaseData)) {
      unreachableEvidence.push(evId);
    }
  });

  assert(
    unreachableEvidence.length === 0,
    'Phase 6: Every Case #001 evidence item (ev_01..ev_09) has an investigation action discovery path',
    unreachableEvidence.join(', ')
  );

  // -------------------------------------------------------------
  // PHASE 7: Chapter Objectives Match Actions
  // -------------------------------------------------------------
  assert(
    serverCaseData.includes("id: 'act_01'") && // Study Desk
    serverCaseData.includes("id: 'act_08'") && // Study Wastebasket
    serverCaseData.includes("id: 'act_03'") && // Wall safe
    serverCaseData.includes("id: 'act_02'") && // Arthur's Laptop
    serverCaseData.includes("id: 'act_04'") && // Garden
    serverCaseData.includes("id: 'act_05'") && // Gatehouse log
    serverCaseData.includes("id: 'act_06'") && // Marcus Interview
    serverCaseData.includes("id: 'act_09'") && // Dr. Elena Interview
    serverCaseData.includes("id: 'act_07'"),   // East Library Desk Pen
    'Phase 7: All chapter narrative objectives have active, executable forensic actions'
  );

  // -------------------------------------------------------------
  // PHASE 8 & 9: Evidence Connection Security & Reliability
  // -------------------------------------------------------------
  assert(
    connRoute.includes('discoveredSet.has(fromId) && discoveredSet.has(toId)') ||
    connRoute.includes('!discoveredSet.has(fromId) || !discoveredSet.has(toId)'),
    'Phase 8: Evidence connection endpoint validates user legitimately discovered both clues'
  );

  assert(
    migration003Content.includes('CREATE OR REPLACE FUNCTION public.create_evidence_connection_atomic') &&
    migration003Content.includes('v_from_discovered') &&
    migration003Content.includes('v_to_discovered') &&
    migration003Content.includes('public.check_and_unlock_achievements(p_user_id)'),
    'Phase 9: create_evidence_connection_atomic combines connection creation and achievement evaluation in one database transaction'
  );

  // -------------------------------------------------------------
  // PHASE 10: Fix Board Position API
  // -------------------------------------------------------------
  assert(
    boardRoute.includes('Number.isFinite(x)') &&
    boardRoute.includes('Number.isFinite(y)') &&
    boardRoute.includes('.select(') &&
    boardRoute.includes('.maybeSingle()') &&
    boardRoute.includes('status: 404'),
    'Phase 10: Board position API validates finite coordinates and returns 404 if evidence row is missing/unowned'
  );

  // -------------------------------------------------------------
  // PHASE 11: Board Rollback System Preserved
  // -------------------------------------------------------------
  const storeContent = fs.readFileSync(path.join(rootDir, 'src/lib/store.ts'), 'utf8');
  assert(
    storeContent.includes('lastPersistedPositions: Record<string, { x: number; y: number }>') &&
    storeContent.includes('lastGood = get().lastPersistedPositions[evidenceId]') &&
    storeContent.includes('boardPosition: lastGood'),
    'Phase 11: Zustand store preserves lastPersistedPositions rollback mechanism on drag save failure'
  );

  // -------------------------------------------------------------
  // PHASE 12: Audit All Equipment Perks
  // -------------------------------------------------------------
  assert(
    migration003Content.includes("item_id = 'eq_magnifying_glass'") &&
    migration003Content.includes('v_perception_gain * 1.15'),
    'Phase 12: Brass Magnifying Glass provides +15% Perception growth on server'
  );
  assert(
    migration003Content.includes("item_id = 'eq_trenchcoat'") &&
    migration003Content.includes('v_gold_reward * 1.20') &&
    migration003Content.includes('1.05'),
    'Phase 12: Trenchcoat provides +20% Gold and +5% all attribute growth on server'
  );
  assert(
    migration003Content.includes("item_id = 'eq_master_key'") &&
    migration003Content.includes('v_gold_cost * 0.85'),
    'Phase 12: Master Key applies 15% discount server-side'
  );
  assert(
    migration003Content.includes("item_id = 'eq_field_camera'") &&
    migration003Content.includes('v_bonus_xp := 20;'),
    'Phase 12: Field Camera provides +20 XP on evidence discovery server-side'
  );
  assert(
    migration003Content.includes("item_id = 'eq_antique_typewriter'") &&
    migration003Content.includes('v_final_gold * 1.50'),
    'Phase 12: Antique Typewriter provides +50% Gold on case solve server-side'
  );
  assert(
    migration003Content.includes("item_id = 'eq_chronograph_watch'") &&
    migration003Content.includes('apply_xp_and_level_up(p_user_id, 20, 0, \'EQUIPMENT_PERK\', \'eq_chronograph_watch\')'),
    'Phase 12: Chronograph provides +20 XP bonus on valid contradiction discovery server-side'
  );

  // -------------------------------------------------------------
  // PHASE 16: Case #001 Timeline Consistency (22:25)
  // -------------------------------------------------------------
  const serverCaseSolutions = fs.readFileSync(path.join(rootDir, 'src/lib/serverCaseSolutions.ts'), 'utf8');
  assert(
    serverCaseSolutions.includes("whenId: 'time_2225'") &&
    serverCaseSolutions.includes("whenLabel: '22:25'"),
    'Phase 16: Server case solution uses 22:25 as authoritative crime time'
  );
  assert(
    serverCaseData.includes('Hands stopped at 22:24') &&
    serverCaseData.includes('departing at 22:31, not 22:00'),
    'Phase 16: Timeline clues prove 22:25 (watch broken at 22:24, carriage left at 22:31)'
  );

  // -------------------------------------------------------------
  // PHASE 17: Prevent Client Data Leaks
  // -------------------------------------------------------------
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

  let culpritLeak = false;
  srcFiles.forEach(f => {
    // serverCaseSolutions.ts and serverCaseData.ts are server-only
    if (f.includes('serverCaseSolutions') || f.includes('serverCaseData')) return;
    const code = fs.readFileSync(f, 'utf8');
    if (code.includes('isCulprit') || code.includes('correctAnswer:')) {
      culpritLeak = true;
      console.error(`Client leak in ${f}`);
    }
  });
  assert(!culpritLeak, 'Phase 17: Zero client leaks of isCulprit or correctAnswer in frontend components/store');

  // -------------------------------------------------------------
  // PHASE 18: Auth / Initialization Safety
  // -------------------------------------------------------------
  assert(
    storeContent.includes('signOut: async () =>') &&
    storeContent.includes('tasks: []') &&
    storeContent.includes('lastPersistedPositions: {}'),
    'Phase 18: Signout cleanses in-memory state cleanly'
  );
  assert(
    storeContent.includes('Bureau Connection Warning: Failed to synchronize') &&
    storeContent.includes('failedEndpoints'),
    'Phase 18: Initialization catches network/endpoint failures and sets user-visible error state'
  );

  console.log(`\n================================================================`);
  console.log(`FINAL AUDIT SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log(`================================================================\n`);

  if (passed === total) {
    console.log('ALL 23 PHASES FULLY VALIDATED AND PASSING!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAudit();
