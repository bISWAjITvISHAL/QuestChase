-- ==========================================================
-- QUESTCHASE MIGRATION 004: QUEST REWARDS, ATTRIBUTE PROGRESSION & CONNECTION SECURITY
-- ==========================================================

-- 1. AUTHORITATIVE ATOMIC QUEST COMPLETION WITH DIFFICULTY-BASED REWARDS & ATTRIBUTE PROGRESSION
CREATE OR REPLACE FUNCTION public.complete_quest_atomic(
  p_user_id UUID,
  p_task_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_profile RECORD;
  v_today DATE := CURRENT_DATE;
  v_last_active DATE;
  v_streak INT := 1;
  v_xp_reward INT := 80;
  v_gold_reward INT := 20;
  v_attr_base INT := 15;
  v_intelligence_gain INT := 0;
  v_perception_gain INT := 0;
  v_discipline_gain INT := 0;
  v_resilience_gain INT := 0;
  v_attr_rewards JSONB;
  v_has_trenchcoat BOOLEAN := FALSE;
  v_has_lens BOOLEAN := FALSE;
  v_completed_at TIMESTAMPTZ := NOW();
  v_lvl_res JSONB;
  v_unlocked_achievements JSONB := '[]'::JSONB;
BEGIN
  -- Strict caller authorization
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- 1. Row-lock task to prevent race conditions & duplicate completions
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quest docket not found.');
  END IF;

  -- 2. Idempotent guard: if already completed, return current profile without double awarding
  IF v_task.is_completed THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'alreadyCompleted', true,
      'message', 'Quest already completed.',
      'profile', jsonb_build_object(
        'id', v_profile.id,
        'xp', v_profile.xp,
        'level', v_profile.level,
        'gold', v_profile.gold,
        'rank', v_profile.rank,
        'streak', v_profile.streak,
        'tasksCompletedCount', v_profile.tasks_completed_count,
        'attributes', jsonb_build_object(
          'intelligence', v_profile.intelligence,
          'perception', v_profile.perception,
          'discipline', v_profile.discipline,
          'resilience', v_profile.resilience
        )
      )
    );
  END IF;

  -- 3. Unified Canonical Rewards based strictly on DIFFICULTY
  IF v_task.difficulty = 'S' THEN
    v_xp_reward := 240;
    v_gold_reward := 70;
    v_attr_base := 35;
  ELSIF v_task.difficulty = 'A' THEN
    v_xp_reward := 180;
    v_gold_reward := 50;
    v_attr_base := 25;
  ELSIF v_task.difficulty = 'B' THEN
    v_xp_reward := 120;
    v_gold_reward := 35;
    v_attr_base := 18;
  ELSIF v_task.difficulty = 'C' THEN
    v_xp_reward := 80;
    v_gold_reward := 20;
    v_attr_base := 15;
  ELSIF v_task.difficulty = 'D' THEN
    v_xp_reward := 60;
    v_gold_reward := 15;
    v_attr_base := 12;
  ELSE -- 'E' or fallback
    v_xp_reward := 40;
    v_gold_reward := 10;
    v_attr_base := 8;
  END IF;

  -- 4. Attribute Growth Allocation
  IF v_task.category IN ('Intelligence', 'Coding') THEN
    v_intelligence_gain := v_attr_base;
  ELSIF v_task.category IN ('Perception', 'Reading') THEN
    v_perception_gain := v_attr_base;
  ELSIF v_task.category IN ('Discipline', 'Fitness', 'Study') THEN
    v_discipline_gain := v_attr_base;
  ELSE -- 'Resilience', 'Work', 'Health', etc.
    v_resilience_gain := v_attr_base;
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

  -- 5. Mark task completed in database
  UPDATE public.tasks
  SET is_completed = TRUE,
      completed_at = v_completed_at,
      xp_reward = v_xp_reward,
      gold_reward = v_gold_reward,
      attribute_rewards = v_attr_rewards,
      updated_at = v_completed_at
  WHERE id = p_task_id AND user_id = p_user_id;

  -- 6. Lock profile row for atomic update
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- 7. Safe Date-based Streak Calculation
  v_last_active := v_profile.last_active_date;
  v_streak := COALESCE(v_profile.streak, 0);

  IF v_last_active IS NULL THEN
    v_streak := 1;
  ELSIF v_last_active = v_today THEN
    v_streak := GREATEST(1, v_streak); -- Same calendar day: maintain streak without multiple increments
  ELSIF v_last_active = v_today - 1 THEN
    v_streak := v_streak + 1;          -- Consecutive day: increment streak
  ELSE
    v_streak := 1;                     -- Missed day: reset streak to 1
  END IF;

  -- 8. Persist updated attributes, streak, task count, and timestamp
  UPDATE public.profiles
  SET streak = v_streak,
      last_active_date = v_today,
      intelligence = COALESCE(v_profile.intelligence, 0) + v_intelligence_gain,
      perception = COALESCE(v_profile.perception, 0) + v_perception_gain,
      discipline = COALESCE(v_profile.discipline, 0) + v_discipline_gain,
      resilience = COALESCE(v_profile.resilience, 0) + v_resilience_gain,
      tasks_completed_count = COALESCE(v_profile.tasks_completed_count, 0) + 1,
      updated_at = v_completed_at
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  -- 9. Apply XP and Gold atomically (using canonical 5-argument function)
  v_lvl_res := public.apply_xp_and_level_up(
    p_user_id,
    v_xp_reward,
    v_gold_reward,
    'QUEST_COMPLETION',
    p_task_id::TEXT
  );

  -- 10. Check and unlock achievements
  v_unlocked_achievements := public.check_and_unlock_achievements(p_user_id);

  -- Fetch latest authoritative profile state
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
      'id', v_profile.id,
      'name', v_profile.name,
      'badgeId', v_profile.badge_id,
      'email', v_profile.email,
      'rank', v_profile.rank,
      'level', v_profile.level,
      'xp', v_profile.xp,
      'xpToNextLevel', v_profile.xp_to_next_level,
      'gold', v_profile.gold,
      'streak', v_profile.streak,
      'lastActiveDate', v_profile.last_active_date,
      'attributes', jsonb_build_object(
        'intelligence', v_profile.intelligence,
        'perception', v_profile.perception,
        'discipline', v_profile.discipline,
        'resilience', v_profile.resilience
      ),
      'tasksCompletedCount', v_profile.tasks_completed_count,
      'casesSolvedCount', v_profile.cases_solved_count,
      'evidenceDiscoveredCount', v_profile.evidence_discovered_count
    ),
    'rewardsGained', jsonb_build_object(
      'xp', v_xp_reward,
      'gold', v_gold_reward,
      'attributes', v_attr_rewards
    ),
    'levelUp', CASE WHEN (v_lvl_res->>'levelsGained')::INT > 0 THEN
      jsonb_build_object(
        'didLevelUp', true,
        'newLevel', (v_lvl_res->>'level')::INT,
        'rank', v_lvl_res->>'rank',
        'bonusGold', (v_lvl_res->>'bonusGold')::INT
      )
    ELSE NULL END
  );
END;
$$;


-- ==========================================================
-- 2. SECURE ATOMIC EVIDENCE CONNECTION WITH SERVER-SIDE CONTRADICTION VALIDATION & ANTI-EXPLOIT
-- ==========================================================
CREATE OR REPLACE FUNCTION public.create_evidence_connection_atomic(
  p_user_id UUID,
  p_case_id TEXT,
  p_from_id TEXT,
  p_to_id TEXT,
  p_is_deduction_valid BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conn_id UUID;
  v_created_at TIMESTAMPTZ := NOW();
  v_has_chronograph BOOLEAN := FALSE;
  v_bonus_xp INT := 0;
  v_unlocked_achievements JSONB := '[]'::JSONB;
  v_is_canonical_contradiction BOOLEAN := FALSE;
  v_perk_source_id TEXT;
  v_already_awarded BOOLEAN := FALSE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- 1. Verify user has discovered both evidence pieces
  IF NOT EXISTS (
    SELECT 1 FROM public.discovered_evidence
    WHERE user_id = p_user_id AND case_id = p_case_id AND evidence_id = p_from_id
  ) OR NOT EXISTS (
    SELECT 1 FROM public.discovered_evidence
    WHERE user_id = p_user_id AND case_id = p_case_id AND evidence_id = p_to_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Both evidence items must be discovered before connecting.');
  END IF;

  -- 2. Authoritatively determine contradiction validity server-side (do NOT trust client boolean)
  IF p_case_id = 'case_001' THEN
    IF (p_from_id = 'ev_07' AND p_to_id = 'ev_06') OR (p_from_id = 'ev_06' AND p_to_id = 'ev_07') THEN
      v_is_canonical_contradiction := TRUE;
    END IF;
  END IF;

  -- 3. Insert connection idempotently
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
    v_is_canonical_contradiction,
    v_created_at
  )
  ON CONFLICT (user_id, case_id, from_evidence_id, to_evidence_id)
  DO UPDATE SET is_deduction_valid = v_is_canonical_contradiction
  RETURNING id, created_at INTO v_conn_id, v_created_at;

  -- 4. Equipment Perk: Chronograph Pocket Watch with Anti-Exploit Check
  -- (+20 XP bonus upon establishing a valid contradiction thread — ONCE per pair)
  IF v_is_canonical_contradiction = TRUE THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_inventory
      WHERE user_id = p_user_id AND item_id = 'eq_chronograph_watch' AND is_equipped = TRUE
    ) INTO v_has_chronograph;

    IF v_has_chronograph THEN
      v_perk_source_id := 'eq_chronograph_' || LEAST(p_from_id, p_to_id) || '_' || GREATEST(p_from_id, p_to_id);

      -- Check if bonus was already awarded in the audit ledger
      SELECT EXISTS(
        SELECT 1 FROM public.reward_transactions
        WHERE user_id = p_user_id AND type = 'EQUIPMENT_PERK' AND source_id = v_perk_source_id
      ) INTO v_already_awarded;

      IF NOT v_already_awarded THEN
        v_bonus_xp := 20;
        PERFORM public.apply_xp_and_level_up(p_user_id, 20, 0, 'EQUIPMENT_PERK', v_perk_source_id);
      END IF;
    END IF;
  END IF;

  -- 5. Transactional achievement evaluation
  v_unlocked_achievements := public.check_and_unlock_achievements(p_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'connectionId', v_conn_id,
    'createdAt', v_created_at,
    'isDeduction', v_is_canonical_contradiction,
    'bonusXp', v_bonus_xp,
    'unlockedAchievements', v_unlocked_achievements
  );
END;
$$;

-- Ensure execute permissions
REVOKE EXECUTE ON FUNCTION public.complete_quest_atomic(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_quest_atomic(UUID, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_evidence_connection_atomic(UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_evidence_connection_atomic(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
