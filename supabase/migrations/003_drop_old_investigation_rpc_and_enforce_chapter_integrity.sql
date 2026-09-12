-- ==============================================================================
-- QUESTCHASE MIGRATION 003: FINAL SECURITY, CHAPTER PROGRESSION & GAME INTEGRITY
-- Explicitly drops the legacy 6-argument execute_investigation_action_atomic overload
-- Enforces server-authoritative Chapter state (ch_01 -> ch_02 -> ch_03 -> ch_04)
-- Enforces server-side locks for Case #002 (Coming Soon)
-- Implements create_evidence_connection_atomic with transactional achievement evaluation
-- ==============================================================================

-- ==========================================================
-- 1. PHASE 1: EXPLICITLY DROP THE LEGACY 6-ARGUMENT OVERLOAD
-- ==========================================================
DROP FUNCTION IF EXISTS public.execute_investigation_action_atomic(
  UUID,
  TEXT,
  TEXT,
  INT,
  TEXT,
  INT
);

-- ==========================================================
-- 2. AUTHORITATIVE ATOMIC INVESTIGATION RPC (3-ARGUMENT ONLY)
--    WITH STRICT CHAPTER GATING & LOGICAL ADVANCEMENT
-- ==========================================================
CREATE OR REPLACE FUNCTION public.execute_investigation_action_atomic(
  p_user_id UUID,
  p_case_id TEXT,
  p_action_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile RECORD;
  v_existing RECORD;
  v_discovered_count INT;
  v_progress_pct INT;
  v_gold_cost INT;
  v_yields_evidence_id TEXT;
  v_total_evidence INT := 9;
  v_req_attr_name TEXT := NULL;
  v_req_attr_val INT := 0;
  v_alt_attr_name TEXT := NULL;
  v_alt_attr_val INT := 0;
  v_user_attr_val INT;
  v_user_alt_val INT;
  v_target_chapter TEXT := 'ch_01';
  v_current_chapter TEXT := 'ch_01';
  v_next_chapter TEXT := 'ch_01';
  v_ch1_clues_count INT := 0;
  v_has_ev05 BOOLEAN := FALSE;
  v_has_ev06 BOOLEAN := FALSE;
  v_has_ev07 BOOLEAN := FALSE;
  v_has_ev08 BOOLEAN := FALSE;
  v_has_ev09 BOOLEAN := FALSE;
  v_has_master_key BOOLEAN := FALSE;
  v_has_camera BOOLEAN := FALSE;
  v_bonus_xp INT := 0;
  v_unlocked_achievements JSONB := '[]'::jsonb;
BEGIN
  -- Security validation: Caller must be authenticated user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- Phase 4: Case #002 is strictly Coming Soon and cannot be investigated
  IF p_case_id = 'case_002' OR p_case_id != 'case_001' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Case Dossier Classified: Case #002 (The Silent Witness) is currently under bureau forensic preparation. Coming soon.'
    );
  END IF;

  -- Canonical Case #001 Investigation Actions Definition
  IF p_case_id = 'case_001' THEN
    IF p_action_id = 'act_01' THEN
      v_gold_cost := 60;
      v_yields_evidence_id := 'ev_01';
      v_req_attr_name := 'perception';
      v_req_attr_val := 3;
      v_target_chapter := 'ch_01';
    ELSIF p_action_id = 'act_08' THEN
      v_gold_cost := 40;
      v_yields_evidence_id := 'ev_02';
      v_req_attr_name := 'perception';
      v_req_attr_val := 2;
      v_target_chapter := 'ch_01';
    ELSIF p_action_id = 'act_03' THEN
      v_gold_cost := 50;
      v_yields_evidence_id := 'ev_03';
      v_req_attr_name := 'perception';
      v_req_attr_val := 3;
      v_target_chapter := 'ch_01';
    ELSIF p_action_id = 'act_02' THEN
      v_gold_cost := 80;
      v_yields_evidence_id := 'ev_04';
      v_req_attr_name := 'intelligence';
      v_req_attr_val := 3;
      v_alt_attr_name := 'discipline';
      v_alt_attr_val := 3;
      v_target_chapter := 'ch_01';
    ELSIF p_action_id = 'act_04' THEN
      v_gold_cost := 50;
      v_yields_evidence_id := 'ev_05';
      v_req_attr_name := 'perception';
      v_req_attr_val := 4;
      v_target_chapter := 'ch_02';
    ELSIF p_action_id = 'act_05' THEN
      v_gold_cost := 90;
      v_yields_evidence_id := 'ev_06';
      v_req_attr_name := 'discipline';
      v_req_attr_val := 3;
      v_alt_attr_name := 'intelligence';
      v_alt_attr_val := 3;
      v_target_chapter := 'ch_02';
    ELSIF p_action_id = 'act_06' THEN
      v_gold_cost := 70;
      v_yields_evidence_id := 'ev_07';
      v_req_attr_name := 'discipline';
      v_req_attr_val := 4;
      v_target_chapter := 'ch_03';
    ELSIF p_action_id = 'act_09' THEN
      v_gold_cost := 60;
      v_yields_evidence_id := 'ev_08';
      v_req_attr_name := 'intelligence';
      v_req_attr_val := 3;
      v_alt_attr_name := 'perception';
      v_alt_attr_val := 3;
      v_target_chapter := 'ch_03';
    ELSIF p_action_id = 'act_07' THEN
      v_gold_cost := 80;
      v_yields_evidence_id := 'ev_09';
      v_req_attr_name := 'perception';
      v_req_attr_val := 4;
      v_target_chapter := 'ch_03';
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Invalid investigation action ID.');
    END IF;
  END IF;

  -- 1. Check Idempotency: Action already executed? (Test 2: harmless already-completed response)
  SELECT * INTO v_existing
  FROM public.executed_actions
  WHERE user_id = p_user_id AND case_id = p_case_id AND action_id = p_action_id;

  IF FOUND THEN
    SELECT gold INTO v_gold_cost FROM public.profiles WHERE id = p_user_id;
    SELECT current_chapter_id INTO v_current_chapter FROM public.case_progress WHERE user_id = p_user_id AND case_id = p_case_id;
    RETURN jsonb_build_object(
      'success', true,
      'alreadyExecuted', true,
      'gold', COALESCE(v_gold_cost, 0),
      'yieldsEvidenceId', v_yields_evidence_id,
      'currentChapterId', COALESCE(v_current_chapter, 'ch_01')
    );
  END IF;

  -- 2. Retrieve authoritative current chapter from case_progress (defaults to ch_01)
  SELECT current_chapter_id INTO v_current_chapter
  FROM public.case_progress
  WHERE user_id = p_user_id AND case_id = p_case_id;

  IF NOT FOUND OR v_current_chapter IS NULL THEN
    v_current_chapter := 'ch_01';
  END IF;

  -- 3. PHASE 2 & 3: Strict Server-Authoritative Chapter Gating
  -- The requested action MUST match the user's current chapter
  IF v_target_chapter != v_current_chapter THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Investigation Action Locked: Action belongs to ' || v_target_chapter || ', but your active investigation is in ' || v_current_chapter || '. Complete current chapter objectives first.'
    );
  END IF;

  -- 4. Concurrency Row Lock: Lock profile row
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Detective profile not found.');
  END IF;

  -- 5. Server-Side Equipment Perk: Master Skeleton Key (15% Gold discount)
  SELECT EXISTS(
    SELECT 1 FROM public.user_inventory 
    WHERE user_id = p_user_id AND item_id = 'eq_master_key' AND is_equipped = TRUE
  ) INTO v_has_master_key;

  IF v_has_master_key THEN
    v_gold_cost := ROUND(v_gold_cost * 0.85);
  END IF;

  -- Check Gold balance
  IF v_profile.gold < v_gold_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough Gold for this investigation.');
  END IF;

  -- 6. Authoritative Attribute Requirement Check
  IF v_req_attr_name = 'intelligence' THEN v_user_attr_val := v_profile.intelligence;
  ELSIF v_req_attr_name = 'perception' THEN v_user_attr_val := v_profile.perception;
  ELSIF v_req_attr_name = 'discipline' THEN v_user_attr_val := v_profile.discipline;
  ELSIF v_req_attr_name = 'resilience' THEN v_user_attr_val := v_profile.resilience;
  ELSE v_user_attr_val := 99;
  END IF;

  IF v_alt_attr_name = 'intelligence' THEN v_user_alt_val := v_profile.intelligence;
  ELSIF v_alt_attr_name = 'perception' THEN v_user_alt_val := v_profile.perception;
  ELSIF v_alt_attr_name = 'discipline' THEN v_user_alt_val := v_profile.discipline;
  ELSIF v_alt_attr_name = 'resilience' THEN v_user_alt_val := v_profile.resilience;
  ELSE v_user_alt_val := 0;
  END IF;

  IF (v_user_attr_val < v_req_attr_val) AND (v_alt_attr_name IS NULL OR v_user_alt_val < v_alt_attr_val) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Investigation Method Locked: Required attribute proficiency not met. Complete casework to build stats.'
    );
  END IF;

  -- 7. Server-Side Equipment Perk: Field Rangefinder Camera (+20 bonus XP for discovering evidence)
  SELECT EXISTS(
    SELECT 1 FROM public.user_inventory 
    WHERE user_id = p_user_id AND item_id = 'eq_field_camera' AND is_equipped = TRUE
  ) INTO v_has_camera;

  IF v_has_camera THEN
    v_bonus_xp := 20;
    PERFORM public.apply_xp_and_level_up(p_user_id, v_bonus_xp, 0, 'EQUIPMENT_PERK', 'eq_field_camera');
  END IF;

  -- 8. Deduct Gold & update evidence count on profile
  UPDATE public.profiles
  SET gold = gold - v_gold_cost,
      evidence_discovered_count = evidence_discovered_count + 1,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING gold INTO v_profile.gold;

  -- Log Gold deduction to ledger
  INSERT INTO public.reward_transactions (user_id, type, source_id, xp_delta, gold_delta)
  VALUES (p_user_id, 'INVESTIGATION_ACTION', p_action_id, 0, -v_gold_cost);

  -- 9. Record executed action
  INSERT INTO public.executed_actions (user_id, case_id, action_id, executed_at)
  VALUES (p_user_id, p_case_id, p_action_id, NOW())
  ON CONFLICT (user_id, case_id, action_id) DO NOTHING;

  -- 10. Record discovered evidence
  SELECT COUNT(*) INTO v_discovered_count
  FROM public.discovered_evidence
  WHERE user_id = p_user_id AND case_id = p_case_id;

  INSERT INTO public.discovered_evidence (user_id, case_id, evidence_id, board_x, board_y, discovered_at)
  VALUES (p_user_id, p_case_id, v_yields_evidence_id, 100 + (v_discovered_count * 80) % 600, 120 + ((v_discovered_count * 60) % 350), NOW())
  ON CONFLICT (user_id, case_id, evidence_id) DO NOTHING;

  -- 11. Authoritative Chapter Advancement Evaluation (Phase 2)
  -- Count newly discovered evidence for this case
  SELECT COUNT(*) INTO v_discovered_count
  FROM public.discovered_evidence
  WHERE user_id = p_user_id AND case_id = p_case_id;

  -- Check specific evidence discovery for chapter requirements
  SELECT COUNT(*) INTO v_ch1_clues_count
  FROM public.discovered_evidence
  WHERE user_id = p_user_id AND case_id = p_case_id AND evidence_id IN ('ev_01', 'ev_02', 'ev_03', 'ev_04');

  SELECT EXISTS(
    SELECT 1 FROM public.discovered_evidence WHERE user_id = p_user_id AND case_id = p_case_id AND evidence_id = 'ev_05'
  ) INTO v_has_ev05;

  SELECT EXISTS(
    SELECT 1 FROM public.discovered_evidence WHERE user_id = p_user_id AND case_id = p_case_id AND evidence_id = 'ev_06'
  ) INTO v_has_ev06;

  SELECT EXISTS(
    SELECT 1 FROM public.discovered_evidence WHERE user_id = p_user_id AND case_id = p_case_id AND evidence_id = 'ev_07'
  ) INTO v_has_ev07;

  SELECT EXISTS(
    SELECT 1 FROM public.discovered_evidence WHERE user_id = p_user_id AND case_id = p_case_id AND evidence_id = 'ev_08'
  ) INTO v_has_ev08;

  SELECT EXISTS(
    SELECT 1 FROM public.discovered_evidence WHERE user_id = p_user_id AND case_id = p_case_id AND evidence_id = 'ev_09'
  ) INTO v_has_ev09;

  -- Chapter progression logic:
  -- ch_01 -> ch_02 requires at least 3 Ch1 clues discovered
  -- ch_02 -> ch_03 requires both ev_05 and ev_06 discovered
  -- ch_03 -> ch_04 requires all ev_07, ev_08, and ev_09 discovered
  v_next_chapter := v_current_chapter;

  IF v_current_chapter = 'ch_01' AND v_ch1_clues_count >= 3 THEN
    v_next_chapter := 'ch_02';
  ELSIF v_current_chapter = 'ch_02' AND v_has_ev05 AND v_has_ev06 THEN
    v_next_chapter := 'ch_03';
  ELSIF v_current_chapter = 'ch_03' AND v_has_ev07 AND v_has_ev08 AND v_has_ev09 THEN
    v_next_chapter := 'ch_04';
  END IF;

  v_progress_pct := LEAST(95, ROUND((v_discovered_count::FLOAT / v_total_evidence) * 100));

  -- Persist authoritative chapter and progress percentage
  INSERT INTO public.case_progress (user_id, case_id, current_chapter_id, progress_percentage, status, updated_at)
  VALUES (p_user_id, p_case_id, v_next_chapter, v_progress_pct, 'IN_PROGRESS', NOW())
  ON CONFLICT (user_id, case_id)
  DO UPDATE SET 
    current_chapter_id = v_next_chapter,
    progress_percentage = EXCLUDED.progress_percentage, 
    updated_at = NOW();

  -- 12. Check and award achievements server-side
  v_unlocked_achievements := public.check_and_unlock_achievements(p_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'gold', v_profile.gold,
    'yieldsEvidenceId', v_yields_evidence_id,
    'progressPercentage', v_progress_pct,
    'currentChapterId', v_next_chapter,
    'bonusXp', v_bonus_xp,
    'unlockedAchievements', v_unlocked_achievements
  );
END;
$$;

-- ==========================================================
-- 3. PHASE 4 & 12: STRICT AUTHORITATIVE CASE SOLVING RPC
--    COMPLETELY BLOCKS CASE #002 (COMING SOON)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.solve_case_atomic(
  p_user_id UUID,
  p_case_id TEXT,
  p_reward_xp INT DEFAULT 500,
  p_reward_gold INT DEFAULT 250
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_case RECORD;
  v_profile RECORD;
  v_final_xp INT := 500;
  v_final_gold INT := 250;
  v_has_typewriter BOOLEAN := FALSE;
  v_lvl_res JSONB;
  v_unlocked_achievements JSONB := '[]'::jsonb;
  v_solved_at TIMESTAMPTZ := NOW();
BEGIN
  -- Security validation: Caller must be authenticated user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- Phase 4: Block Case #002 completely
  IF p_case_id = 'case_002' OR p_case_id != 'case_001' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Case Dossier Classified: Case #002 (The Silent Witness) is currently undergoing bureau preparation (Coming Soon) and cannot be solved.'
    );
  END IF;

  -- Canonical Case #001 Rewards (Strictly 500 XP + 250 Gold)
  v_final_xp := 500;
  v_final_gold := 250;

  -- 1. Idempotency check: Already solved?
  SELECT * INTO v_case
  FROM public.case_progress
  WHERE user_id = p_user_id AND case_id = p_case_id
  FOR UPDATE;

  IF FOUND AND v_case.is_solved = TRUE THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'alreadySolved', true,
      'message', 'Case already closed. No duplicate reward awarded.',
      'profile', jsonb_build_object(
        'xp', v_profile.xp,
        'level', v_profile.level,
        'gold', v_profile.gold,
        'rank', v_profile.rank
      )
    );
  END IF;

  -- 2. Server-Side Equipment Perk: Antique Remington Typewriter (+50% Gold bonus upon case solution)
  SELECT EXISTS(
    SELECT 1 FROM public.user_inventory 
    WHERE user_id = p_user_id AND item_id = 'eq_antique_typewriter' AND is_equipped = TRUE
  ) INTO v_has_typewriter;

  IF v_has_typewriter THEN
    v_final_gold := ROUND(v_final_gold * 1.50);
  END IF;

  -- 3. Mark case solved in database
  INSERT INTO public.case_progress (user_id, case_id, is_solved, status, progress_percentage, current_chapter_id, solved_at, updated_at)
  VALUES (p_user_id, p_case_id, TRUE, 'SOLVED', 100, 'ch_04', v_solved_at, v_solved_at)
  ON CONFLICT (user_id, case_id)
  DO UPDATE SET 
    is_solved = TRUE, 
    status = 'SOLVED', 
    progress_percentage = 100, 
    current_chapter_id = 'ch_04',
    solved_at = v_solved_at, 
    updated_at = v_solved_at;

  -- 4. Update cases solved count on profile
  UPDATE public.profiles
  SET cases_solved_count = cases_solved_count + 1,
      updated_at = v_solved_at
  WHERE id = p_user_id;

  -- 5. Atomically award XP and Gold through single canonical rewards system
  v_lvl_res := public.apply_xp_and_level_up(
    p_user_id,
    v_final_xp,
    v_final_gold,
    'CASE_SOLVED',
    p_case_id
  );

  -- 6. Evaluate achievements atomically
  v_unlocked_achievements := public.check_and_unlock_achievements(p_user_id);

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'alreadySolved', false,
    'rewardXp', v_final_xp,
    'rewardGold', v_final_gold,
    'levelUpResult', v_lvl_res,
    'unlockedAchievements', v_unlocked_achievements,
    'profile', jsonb_build_object(
      'xp', v_profile.xp,
      'level', v_profile.level,
      'gold', v_profile.gold,
      'rank', v_profile.rank,
      'casesSolvedCount', v_profile.cases_solved_count
    )
  );
END;
$$;

-- ==========================================================
-- 4. PHASE 8 & 9: TRANSACTIONAL EVIDENCE CONNECTION RPC
--    ENFORCES EVIDENCE OWNERSHIP & RELIABLE ACHIEVEMENTS
-- ==========================================================
CREATE OR REPLACE FUNCTION public.create_evidence_connection_atomic(
  p_user_id UUID,
  p_case_id TEXT,
  p_from_id TEXT,
  p_to_id TEXT,
  p_is_deduction_valid BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_from_discovered BOOLEAN := FALSE;
  v_to_discovered BOOLEAN := FALSE;
  v_conn_id UUID;
  v_created_at TIMESTAMPTZ := NOW();
  v_has_chronograph BOOLEAN := FALSE;
  v_bonus_xp INT := 0;
  v_unlocked_achievements JSONB := '[]'::jsonb;
BEGIN
  -- Security validation: Caller must be authenticated user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- Phase 4: Reject connection attempts on unreleased cases
  IF p_case_id = 'case_002' OR p_case_id != 'case_001' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Case Dossier Classified: Case #002 is under bureau preparation.'
    );
  END IF;

  -- Validate distinct IDs
  IF p_from_id IS NULL OR p_to_id IS NULL OR p_from_id = p_to_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Two distinct evidence IDs are required to establish a connection.'
    );
  END IF;

  -- PHASE 8: Server verifies user owns/discovered evidence A and evidence B on THIS case
  SELECT EXISTS(
    SELECT 1 FROM public.discovered_evidence
    WHERE user_id = p_user_id AND case_id = p_case_id AND evidence_id = p_from_id
  ) INTO v_from_discovered;

  SELECT EXISTS(
    SELECT 1 FROM public.discovered_evidence
    WHERE user_id = p_user_id AND case_id = p_case_id AND evidence_id = p_to_id
  ) INTO v_to_discovered;

  IF NOT v_from_discovered OR NOT v_to_discovered THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot connect clues that have not been legitimately discovered in your active investigation.'
    );
  END IF;

  -- Insert connection idempotently
  INSERT INTO public.evidence_connections (
    user_id,
    case_id,
    from_evidence_id,
    to_evidence_id,
    is_deduction_valid,
    created_at
  )
  VALUES (
    p_user_id,
    p_case_id,
    p_from_id,
    p_to_id,
    p_is_deduction_valid,
    v_created_at
  )
  ON CONFLICT (user_id, case_id, from_evidence_id, to_evidence_id)
  DO UPDATE SET is_deduction_valid = EXCLUDED.is_deduction_valid
  RETURNING id, created_at INTO v_conn_id, v_created_at;

  -- Phase 12 Equipment Perk: Chronograph Pocket Watch
  -- +20 XP bonus upon establishing a valid contradiction thread
  IF p_is_deduction_valid = TRUE THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_inventory
      WHERE user_id = p_user_id AND item_id = 'eq_chronograph_watch' AND is_equipped = TRUE
    ) INTO v_has_chronograph;

    IF v_has_chronograph THEN
      v_bonus_xp := 20;
      PERFORM public.apply_xp_and_level_up(p_user_id, 20, 0, 'EQUIPMENT_PERK', 'eq_chronograph_watch');
    END IF;
  END IF;

  -- PHASE 9: Transactional achievement evaluation (reliable, never swallows errors)
  v_unlocked_achievements := public.check_and_unlock_achievements(p_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'connectionId', v_conn_id,
    'createdAt', v_created_at,
    'isDeduction', p_is_deduction_valid,
    'bonusXp', v_bonus_xp,
    'unlockedAchievements', v_unlocked_achievements
  );
END;
$$;

-- ==========================================================
-- 5. PHASE 12: TRENCHCOAT ALL-ATTRIBUTES GAIN ENHANCEMENT
--    IN COMPLETE_QUEST_ATOMIC
-- ==========================================================
CREATE OR REPLACE FUNCTION public.complete_quest_atomic(
  p_user_id UUID,
  p_task_id UUID,
  p_claimed_xp INT DEFAULT NULL,
  p_claimed_gold INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task RECORD;
  v_profile RECORD;
  v_xp_reward INT;
  v_gold_reward INT;
  v_intelligence_gain INT := 0;
  v_perception_gain INT := 0;
  v_discipline_gain INT := 0;
  v_resilience_gain INT := 0;
  v_has_trenchcoat BOOLEAN := FALSE;
  v_has_lens BOOLEAN := FALSE;
  v_attr_rewards JSONB;
  v_lvl_res JSONB;
  v_unlocked_achievements JSONB;
  v_completed_at TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quest docket not found.');
  END IF;

  IF v_task.is_completed THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'alreadyCompleted', true,
      'message', 'Quest already completed.',
      'profile', jsonb_build_object(
        'xp', v_profile.xp,
        'level', v_profile.level,
        'gold', v_profile.gold,
        'rank', v_profile.rank
      )
    );
  END IF;

  IF v_task.priority = 'HIGH' THEN
    v_xp_reward := 100;
    v_gold_reward := 60;
  ELSIF v_task.priority = 'MEDIUM' THEN
    v_xp_reward := 60;
    v_gold_reward := 35;
  ELSE
    v_xp_reward := 40;
    v_gold_reward := 20;
  END IF;

  IF v_task.category = 'Intelligence' THEN
    v_intelligence_gain := GREATEST(v_intelligence_gain, 15);
  ELSIF v_task.category = 'Perception' THEN
    v_perception_gain := GREATEST(v_perception_gain, 15);
  ELSIF v_task.category = 'Discipline' THEN
    v_discipline_gain := GREATEST(v_discipline_gain, 15);
  ELSIF v_task.category = 'Resilience' THEN
    v_resilience_gain := GREATEST(v_resilience_gain, 15);
  END IF;

  -- Equipment Perk: Inspector Wool Trenchcoat (+20% Gold yield & +5% all attribute gains)
  SELECT EXISTS(
    SELECT 1 FROM public.user_inventory 
    WHERE user_id = p_user_id AND item_id = 'eq_trenchcoat' AND is_equipped = TRUE
  ) INTO v_has_trenchcoat;

  IF v_has_trenchcoat THEN
    v_gold_reward := ROUND(v_gold_reward * 1.20);
    IF v_intelligence_gain > 0 THEN v_intelligence_gain := ROUND(v_intelligence_gain * 1.05); END IF;
    IF v_perception_gain > 0 THEN v_perception_gain := ROUND(v_perception_gain * 1.05); END IF;
    IF v_discipline_gain > 0 THEN v_discipline_gain := ROUND(v_discipline_gain * 1.05); END IF;
    IF v_resilience_gain > 0 THEN v_resilience_gain := ROUND(v_resilience_gain * 1.05); END IF;
  END IF;

  -- Equipment Perk: Brass Magnifying Glass (+15% Perception growth)
  SELECT EXISTS(
    SELECT 1 FROM public.user_inventory 
    WHERE user_id = p_user_id AND item_id = 'eq_magnifying_glass' AND is_equipped = TRUE
  ) INTO v_has_lens;

  IF v_has_lens AND v_perception_gain > 0 THEN
    v_perception_gain := ROUND(v_perception_gain * 1.15);
  END IF;

  v_attr_rewards := jsonb_build_object(
    'intelligence', v_intelligence_gain,
    'perception', v_perception_gain,
    'discipline', v_discipline_gain,
    'resilience', v_resilience_gain
  );

  UPDATE public.tasks
  SET is_completed = TRUE,
      completed_at = v_completed_at,
      xp_reward = v_xp_reward,
      gold_reward = v_gold_reward,
      updated_at = v_completed_at
  WHERE id = p_task_id AND user_id = p_user_id;

  v_lvl_res := public.apply_xp_and_level_up(
    p_user_id,
    v_xp_reward,
    v_gold_reward,
    'QUEST_COMPLETION',
    p_task_id::TEXT,
    v_attr_rewards
  );

  v_unlocked_achievements := public.check_and_unlock_achievements(p_user_id);

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'alreadyCompleted', false,
    'rewardXp', v_xp_reward,
    'rewardGold', v_gold_reward,
    'attributeRewards', v_attr_rewards,
    'levelUpResult', v_lvl_res,
    'unlockedAchievements', v_unlocked_achievements,
    'profile', jsonb_build_object(
      'xp', v_profile.xp,
      'level', v_profile.level,
      'gold', v_profile.gold,
      'rank', v_profile.rank,
      'attributes', jsonb_build_object(
        'intelligence', v_profile.intelligence,
        'perception', v_profile.perception,
        'discipline', v_profile.discipline,
        'resilience', v_profile.resilience
      )
    )
  );
END;
$$;

-- Grant permissions to authenticated users
REVOKE EXECUTE ON FUNCTION public.execute_investigation_action_atomic(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_investigation_action_atomic(UUID, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.solve_case_atomic(UUID, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.solve_case_atomic(UUID, TEXT, INT, INT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_evidence_connection_atomic(UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_evidence_connection_atomic(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.complete_quest_atomic(UUID, UUID, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_quest_atomic(UUID, UUID, INT, INT) TO authenticated;
