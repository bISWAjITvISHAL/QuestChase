-- ==========================================================
-- QUESTCHASE MIGRATION 002: BACKEND SECURITY & GAME INTEGRITY
-- ==========================================================

-- 1. DROP INSECURE BROAD "FOR ALL" RLS POLICIES
DROP POLICY IF EXISTS "Users can manage own case progress" ON public.case_progress;
DROP POLICY IF EXISTS "Users can manage own evidence" ON public.discovered_evidence;
DROP POLICY IF EXISTS "Users can manage own actions" ON public.executed_actions;
DROP POLICY IF EXISTS "Users can manage own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can manage own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. DATABASE CONSTRAINTS & DATA INTEGRITY
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profile_gold_non_negative') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profile_gold_non_negative CHECK (gold >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profile_xp_non_negative') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profile_xp_non_negative CHECK (xp >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profile_level_positive') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profile_level_positive CHECK (level >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profile_streak_non_negative') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profile_streak_non_negative CHECK (streak >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_case_progress_pct') THEN
    ALTER TABLE public.case_progress ADD CONSTRAINT chk_case_progress_pct CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
  END IF;
END $$;

-- 3. REWARD TRANSACTIONS AUDIT LEDGER
CREATE TABLE IF NOT EXISTS public.reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  xp_delta INT NOT NULL DEFAULT 0,
  gold_delta INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own reward transactions" ON public.reward_transactions;
CREATE POLICY "Users can view own reward transactions"
  ON public.reward_transactions FOR SELECT
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.reward_transactions FROM authenticated;

-- 4. SECURE RLS POLICIES

-- Profiles:
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile non_gameplay" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, settings, updated_at) ON public.profiles TO authenticated;

-- Protective trigger on profiles: block direct client tampering with game stats
CREATE OR REPLACE FUNCTION public.protect_profile_gameplay_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_setting('role', true) = 'authenticated' OR current_setting('request.jwt.claim.role', true) = 'authenticated') 
     AND pg_trigger_depth() <= 1 THEN
    IF NEW.gold != OLD.gold OR
       NEW.xp != OLD.xp OR
       NEW.level != OLD.level OR
       NEW.rank != OLD.rank OR
       NEW.streak != OLD.streak OR
       NEW.intelligence != OLD.intelligence OR
       NEW.perception != OLD.perception OR
       NEW.discipline != OLD.discipline OR
       NEW.resilience != OLD.resilience OR
       NEW.tasks_completed_count != OLD.tasks_completed_count OR
       NEW.cases_solved_count != OLD.cases_solved_count OR
       NEW.evidence_discovered_count != OLD.evidence_discovered_count OR
       NEW.last_active_date IS DISTINCT FROM OLD.last_active_date THEN
      RAISE EXCEPTION 'Security Violation: Direct client mutation of detective gameplay stats is prohibited';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_profile_gameplay ON public.profiles;
CREATE TRIGGER trg_protect_profile_gameplay
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_gameplay_columns();

-- Case Progress:
CREATE POLICY "Users can view own case progress" 
  ON public.case_progress FOR SELECT 
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.case_progress FROM authenticated;

-- Discovered Evidence:
CREATE POLICY "Users can view own evidence" 
  ON public.discovered_evidence FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own evidence board position" 
  ON public.discovered_evidence FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE INSERT, DELETE ON public.discovered_evidence FROM authenticated;
REVOKE UPDATE ON public.discovered_evidence FROM authenticated;
GRANT UPDATE (board_x, board_y) ON public.discovered_evidence TO authenticated;

-- Executed Actions:
CREATE POLICY "Users can view own actions" 
  ON public.executed_actions FOR SELECT 
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.executed_actions FROM authenticated;

-- Inventory:
CREATE POLICY "Users can view own inventory" 
  ON public.user_inventory FOR SELECT 
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.user_inventory FROM authenticated;

-- Achievements:
CREATE POLICY "Users can view own achievements" 
  ON public.user_achievements FOR SELECT 
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.user_achievements FROM authenticated;

-- Tasks:
REVOKE UPDATE (is_completed, completed_at, xp_reward, gold_reward, attribute_rewards) ON public.tasks FROM authenticated;


-- ==========================================================
-- 5. CANONICAL LEVEL, XP, AND RANK CALCULATION HELPER
-- ==========================================================
CREATE OR REPLACE FUNCTION public.apply_xp_and_level_up(
  p_user_id UUID,
  p_xp_delta INT,
  p_gold_delta INT,
  p_source_type TEXT,
  p_source_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile RECORD;
  v_new_xp INT;
  v_new_level INT;
  v_xp_to_next INT;
  v_new_rank TEXT;
  v_levels_gained INT := 0;
  v_bonus_gold INT := 0;
  v_final_gold INT;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_new_level := v_profile.level;
  v_new_xp := v_profile.xp + p_xp_delta;
  v_xp_to_next := COALESCE(v_profile.xp_to_next_level, ROUND(100 * POWER(v_new_level, 1.35)));

  WHILE v_new_xp >= v_xp_to_next LOOP
    v_new_xp := v_new_xp - v_xp_to_next;
    v_new_level := v_new_level + 1;
    v_levels_gained := v_levels_gained + 1;
    v_xp_to_next := ROUND(100 * POWER(v_new_level, 1.35));
  END LOOP;

  -- Canonical Level-Up Bonus: +50 Gold for EVERY level gained across all XP sources
  v_bonus_gold := v_levels_gained * 50;
  v_final_gold := v_profile.gold + p_gold_delta + v_bonus_gold;

  -- Canonical Rank Assignment
  IF v_new_level >= 30 THEN v_new_rank := 'MASTER DETECTIVE';
  ELSIF v_new_level >= 25 THEN v_new_rank := 'CHIEF INVESTIGATOR';
  ELSIF v_new_level >= 20 THEN v_new_rank := 'SENIOR INVESTIGATOR';
  ELSIF v_new_level >= 15 THEN v_new_rank := 'SPECIALIST';
  ELSIF v_new_level >= 10 THEN v_new_rank := 'INSPECTOR';
  ELSIF v_new_level >= 6 THEN v_new_rank := 'INVESTIGATOR';
  ELSIF v_new_level >= 3 THEN v_new_rank := 'DETECTIVE';
  ELSE v_new_rank := 'ROOKIE';
  END IF;

  UPDATE public.profiles
  SET xp = v_new_xp,
      level = v_new_level,
      xp_to_next_level = v_xp_to_next,
      rank = v_new_rank,
      gold = v_final_gold,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  -- Audit ledger logging
  IF p_xp_delta != 0 OR p_gold_delta != 0 THEN
    INSERT INTO public.reward_transactions (user_id, type, source_id, xp_delta, gold_delta)
    VALUES (p_user_id, p_source_type, p_source_id, p_xp_delta, p_gold_delta);
  END IF;

  IF v_bonus_gold > 0 THEN
    INSERT INTO public.reward_transactions (user_id, type, source_id, xp_delta, gold_delta)
    VALUES (p_user_id, 'LEVEL_UP_BONUS', 'level_' || v_new_level, 0, v_bonus_gold);
  END IF;

  RETURN jsonb_build_object(
    'level', v_new_level,
    'xp', v_new_xp,
    'xpToNextLevel', v_xp_to_next,
    'rank', v_new_rank,
    'gold', v_final_gold,
    'levelsGained', v_levels_gained,
    'bonusGold', v_bonus_gold
  );
END;
$$;


-- ==========================================================
-- 6. SERVER-AUTHORITATIVE ACHIEVEMENT EVALUATION
-- ==========================================================
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile RECORD;
  v_completed_tasks INT;
  v_discovered_clues INT;
  v_solved_cases INT;
  v_connections INT;
  v_valid_deductions INT;
  v_newly_unlocked JSONB := '[]'::jsonb;
  v_was_unlocked BOOLEAN;
BEGIN
  -- Concurrency-safe lock on the user's profile row
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN '[]'::jsonb; END IF;

  SELECT COUNT(*) INTO v_completed_tasks FROM public.tasks WHERE user_id = p_user_id AND is_completed = TRUE;
  SELECT COUNT(*) INTO v_discovered_clues FROM public.discovered_evidence WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_solved_cases FROM public.case_progress WHERE user_id = p_user_id AND is_solved = TRUE;
  SELECT COUNT(*) INTO v_connections FROM public.evidence_connections WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_valid_deductions FROM public.evidence_connections WHERE user_id = p_user_id AND is_deduction_valid = TRUE;

  -- 1. ach_first_task: Complete first quest (50 XP, 30 Gold)
  IF v_completed_tasks >= 1 THEN
    WITH ins AS (
      INSERT INTO public.user_achievements (user_id, achievement_id, is_unlocked, progress, unlocked_at)
      VALUES (p_user_id, 'ach_first_task', TRUE, 1, NOW())
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET is_unlocked = TRUE, progress = 1, unlocked_at = NOW()
      WHERE user_achievements.is_unlocked = FALSE
      RETURNING achievement_id
    )
    SELECT EXISTS(SELECT 1 FROM ins) INTO v_was_unlocked;
    IF v_was_unlocked THEN
      PERFORM public.apply_xp_and_level_up(p_user_id, 50, 30, 'ACHIEVEMENT_UNLOCKED', 'ach_first_task');
      v_newly_unlocked := v_newly_unlocked || jsonb_build_object('id', 'ach_first_task', 'title', 'First Assignment', 'rewardXp', 50, 'rewardGold', 30);
    END IF;
  END IF;

  -- 2. ach_first_case: Initiate or solve first case (75 XP, 50 Gold)
  IF (v_discovered_clues >= 1 OR v_solved_cases >= 1) THEN
    WITH ins AS (
      INSERT INTO public.user_achievements (user_id, achievement_id, is_unlocked, progress, unlocked_at)
      VALUES (p_user_id, 'ach_first_case', TRUE, 1, NOW())
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET is_unlocked = TRUE, progress = 1, unlocked_at = NOW()
      WHERE user_achievements.is_unlocked = FALSE
      RETURNING achievement_id
    )
    SELECT EXISTS(SELECT 1 FROM ins) INTO v_was_unlocked;
    IF v_was_unlocked THEN
      PERFORM public.apply_xp_and_level_up(p_user_id, 75, 50, 'ACHIEVEMENT_UNLOCKED', 'ach_first_case');
      v_newly_unlocked := v_newly_unlocked || jsonb_build_object('id', 'ach_first_case', 'title', 'First Case', 'rewardXp', 75, 'rewardGold', 50);
    END IF;
  END IF;

  -- 3. ach_sharp_eyes: Discover 5 clues (120 XP, 75 Gold)
  IF v_discovered_clues >= 5 THEN
    WITH ins AS (
      INSERT INTO public.user_achievements (user_id, achievement_id, is_unlocked, progress, unlocked_at)
      VALUES (p_user_id, 'ach_sharp_eyes', TRUE, 5, NOW())
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET is_unlocked = TRUE, progress = 5, unlocked_at = NOW()
      WHERE user_achievements.is_unlocked = FALSE
      RETURNING achievement_id
    )
    SELECT EXISTS(SELECT 1 FROM ins) INTO v_was_unlocked;
    IF v_was_unlocked THEN
      PERFORM public.apply_xp_and_level_up(p_user_id, 120, 75, 'ACHIEVEMENT_UNLOCKED', 'ach_sharp_eyes');
      v_newly_unlocked := v_newly_unlocked || jsonb_build_object('id', 'ach_sharp_eyes', 'title', 'Sharp Eyes', 'rewardXp', 120, 'rewardGold', 75);
    END IF;
  END IF;

  -- 4. ach_cold_case: 3-day streak (200 XP, 100 Gold)
  IF v_profile.streak >= 3 THEN
    WITH ins AS (
      INSERT INTO public.user_achievements (user_id, achievement_id, is_unlocked, progress, unlocked_at)
      VALUES (p_user_id, 'ach_cold_case', TRUE, 3, NOW())
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET is_unlocked = TRUE, progress = 3, unlocked_at = NOW()
      WHERE user_achievements.is_unlocked = FALSE
      RETURNING achievement_id
    )
    SELECT EXISTS(SELECT 1 FROM ins) INTO v_was_unlocked;
    IF v_was_unlocked THEN
      PERFORM public.apply_xp_and_level_up(p_user_id, 200, 100, 'ACHIEVEMENT_UNLOCKED', 'ach_cold_case');
      v_newly_unlocked := v_newly_unlocked || jsonb_build_object('id', 'ach_cold_case', 'title', 'Investigation Streak', 'rewardXp', 200, 'rewardGold', 100);
    END IF;
  END IF;

  -- 5. ach_red_yarn: 1 connection (100 XP, 60 Gold)
  IF v_connections >= 1 THEN
    WITH ins AS (
      INSERT INTO public.user_achievements (user_id, achievement_id, is_unlocked, progress, unlocked_at)
      VALUES (p_user_id, 'ach_red_yarn', TRUE, 1, NOW())
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET is_unlocked = TRUE, progress = 1, unlocked_at = NOW()
      WHERE user_achievements.is_unlocked = FALSE
      RETURNING achievement_id
    )
    SELECT EXISTS(SELECT 1 FROM ins) INTO v_was_unlocked;
    IF v_was_unlocked THEN
      PERFORM public.apply_xp_and_level_up(p_user_id, 100, 60, 'ACHIEVEMENT_UNLOCKED', 'ach_red_yarn');
      v_newly_unlocked := v_newly_unlocked || jsonb_build_object('id', 'ach_red_yarn', 'title', 'Thread of Truth', 'rewardXp', 100, 'rewardGold', 60);
    END IF;
  END IF;

  -- 6. ach_master_deduction: 3 valid deductions (250 XP, 150 Gold)
  IF v_valid_deductions >= 3 THEN
    WITH ins AS (
      INSERT INTO public.user_achievements (user_id, achievement_id, is_unlocked, progress, unlocked_at)
      VALUES (p_user_id, 'ach_master_deduction', TRUE, 3, NOW())
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET is_unlocked = TRUE, progress = 3, unlocked_at = NOW()
      WHERE user_achievements.is_unlocked = FALSE
      RETURNING achievement_id
    )
    SELECT EXISTS(SELECT 1 FROM ins) INTO v_was_unlocked;
    IF v_was_unlocked THEN
      PERFORM public.apply_xp_and_level_up(p_user_id, 250, 150, 'ACHIEVEMENT_UNLOCKED', 'ach_master_deduction');
      v_newly_unlocked := v_newly_unlocked || jsonb_build_object('id', 'ach_master_deduction', 'title', 'Master of Details', 'rewardXp', 250, 'rewardGold', 150);
    END IF;
  END IF;

  -- 7. ach_case_closed: Case #001 solved (500 XP, 250 Gold)
  IF v_solved_cases >= 1 THEN
    WITH ins AS (
      INSERT INTO public.user_achievements (user_id, achievement_id, is_unlocked, progress, unlocked_at)
      VALUES (p_user_id, 'ach_case_closed', TRUE, 1, NOW())
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET is_unlocked = TRUE, progress = 1, unlocked_at = NOW()
      WHERE user_achievements.is_unlocked = FALSE
      RETURNING achievement_id
    )
    SELECT EXISTS(SELECT 1 FROM ins) INTO v_was_unlocked;
    IF v_was_unlocked THEN
      PERFORM public.apply_xp_and_level_up(p_user_id, 500, 250, 'ACHIEVEMENT_UNLOCKED', 'ach_case_closed');
      v_newly_unlocked := v_newly_unlocked || jsonb_build_object('id', 'ach_case_closed', 'title', 'Case #001 Closed', 'rewardXp', 500, 'rewardGold', 250);
    END IF;
  END IF;

  -- 8. ach_polymath: All 4 attributes >= 5 (300 XP, 200 Gold)
  IF v_profile.intelligence >= 5 AND v_profile.perception >= 5 AND v_profile.discipline >= 5 AND v_profile.resilience >= 5 THEN
    WITH ins AS (
      INSERT INTO public.user_achievements (user_id, achievement_id, is_unlocked, progress, unlocked_at)
      VALUES (p_user_id, 'ach_polymath', TRUE, 4, NOW())
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET is_unlocked = TRUE, progress = 4, unlocked_at = NOW()
      WHERE user_achievements.is_unlocked = FALSE
      RETURNING achievement_id
    )
    SELECT EXISTS(SELECT 1 FROM ins) INTO v_was_unlocked;
    IF v_was_unlocked THEN
      PERFORM public.apply_xp_and_level_up(p_user_id, 300, 200, 'ACHIEVEMENT_UNLOCKED', 'ach_polymath');
      v_newly_unlocked := v_newly_unlocked || jsonb_build_object('id', 'ach_polymath', 'title', 'Polymath Mind', 'rewardXp', 300, 'rewardGold', 200);
    END IF;
  END IF;

  RETURN v_newly_unlocked;
END;
$$;


-- ==========================================================
-- 7. ATOMIC QUEST COMPLETION WITH EQUIPMENT PERKS & ACHIEVEMENTS
-- ==========================================================
CREATE OR REPLACE FUNCTION public.complete_quest_atomic(
  p_user_id UUID,
  p_task_id UUID
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
  v_attr_rewards JSONB;
  v_lvl_res JSONB;
  v_today DATE := CURRENT_DATE;
  v_last_active DATE;
  v_streak INT;
  v_intelligence_gain INT := 0;
  v_perception_gain INT := 0;
  v_discipline_gain INT := 0;
  v_resilience_gain INT := 0;
  v_completed_at TIMESTAMPTZ := NOW();
  v_has_trenchcoat BOOLEAN := FALSE;
  v_has_lens BOOLEAN := FALSE;
  v_unlocked_achievements JSONB;
BEGIN
  -- Security validation: Caller must be the authenticated user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- 1. Lock task row
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quest not found');
  END IF;

  -- 2. Idempotency guard: Already completed?
  IF v_task.is_completed THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'alreadyCompleted', true,
      'task', jsonb_build_object('id', v_task.id, 'isCompleted', true, 'completedAt', v_task.completed_at),
      'profile', jsonb_build_object(
        'id', v_profile.id,
        'level', v_profile.level,
        'xp', v_profile.xp,
        'gold', v_profile.gold,
        'streak', v_profile.streak,
        'rank', v_profile.rank
      )
    );
  END IF;

  -- 3. Calculate canonical difficulty rewards
  IF v_task.difficulty = 'A' THEN
    v_xp_reward := 180;
    v_gold_reward := 50;
    v_intelligence_gain := 25;
    v_resilience_gain := 10;
  ELSIF v_task.difficulty = 'B' THEN
    v_xp_reward := 120;
    v_gold_reward := 35;
    v_discipline_gain := 18;
    v_intelligence_gain := 10;
  ELSIF v_task.difficulty = 'C' THEN
    v_xp_reward := 80;
    v_gold_reward := 20;
    v_resilience_gain := 15;
    v_discipline_gain := 10;
  ELSIF v_task.difficulty = 'D' THEN
    v_xp_reward := 60;
    v_gold_reward := 15;
    v_perception_gain := 12;
    v_discipline_gain := 8;
  ELSE
    v_xp_reward := 40;
    v_gold_reward := 10;
    v_discipline_gain := 8;
  END IF;

  -- Apply category focus
  IF v_task.category = 'Intelligence' THEN
    v_intelligence_gain := GREATEST(v_intelligence_gain, 15);
  ELSIF v_task.category = 'Perception' THEN
    v_perception_gain := GREATEST(v_perception_gain, 15);
  ELSIF v_task.category = 'Discipline' THEN
    v_discipline_gain := GREATEST(v_discipline_gain, 15);
  ELSIF v_task.category = 'Resilience' THEN
    v_resilience_gain := GREATEST(v_resilience_gain, 15);
  END IF;

  -- 4. Server-Side Equipment Perks
  SELECT EXISTS(
    SELECT 1 FROM public.user_inventory 
    WHERE user_id = p_user_id AND item_id = 'eq_trenchcoat' AND is_equipped = TRUE
  ) INTO v_has_trenchcoat;

  IF v_has_trenchcoat THEN
    v_gold_reward := ROUND(v_gold_reward * 1.20); -- +20% Gold yield from casework
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_inventory 
    WHERE user_id = p_user_id AND item_id = 'eq_magnifying_glass' AND is_equipped = TRUE
  ) INTO v_has_lens;

  IF v_has_lens AND v_perception_gain > 0 THEN
    v_perception_gain := ROUND(v_perception_gain * 1.15); -- +15% Perception growth
  END IF;

  v_attr_rewards := jsonb_build_object(
    'intelligence', v_intelligence_gain,
    'perception', v_perception_gain,
    'discipline', v_discipline_gain,
    'resilience', v_resilience_gain
  );

  -- 5. Mark task completed
  UPDATE public.tasks
  SET is_completed = TRUE,
      completed_at = v_completed_at,
      xp_reward = v_xp_reward,
      gold_reward = v_gold_reward,
      attribute_rewards = v_attr_rewards,
      updated_at = v_completed_at
  WHERE id = p_task_id;

  -- 6. Lock profile row
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- 7. Date-based Streak Calculation
  v_last_active := v_profile.last_active_date;
  v_streak := COALESCE(v_profile.streak, 0);

  IF v_last_active IS NULL THEN
    v_streak := 1;
  ELSIF v_last_active = v_today THEN
    v_streak := GREATEST(1, v_streak); -- Already completed casework today: maintain
  ELSIF v_last_active = v_today - 1 THEN
    v_streak := v_streak + 1;          -- Consecutive calendar day: extend streak
  ELSE
    v_streak := 1;                     -- Missed calendar day: reset to 1
  END IF;

  -- Update attributes, tasks count, and streak
  UPDATE public.profiles
  SET streak = v_streak,
      last_active_date = v_today,
      intelligence = v_profile.intelligence + v_intelligence_gain,
      perception = v_profile.perception + v_perception_gain,
      discipline = v_profile.discipline + v_discipline_gain,
      resilience = v_profile.resilience + v_resilience_gain,
      tasks_completed_count = v_profile.tasks_completed_count + 1,
      updated_at = v_completed_at
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  -- 8. Apply canonical XP, Level, Rank, and Level-up Bonus
  v_lvl_res := public.apply_xp_and_level_up(p_user_id, v_xp_reward, v_gold_reward, 'QUEST_COMPLETION', v_task.id::text);

  -- 9. Check and award achievements server-side
  v_unlocked_achievements := public.check_and_unlock_achievements(p_user_id);

  -- Re-read latest profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'task', jsonb_build_object('id', v_task.id, 'isCompleted', true, 'completedAt', v_completed_at),
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
    ELSE NULL END,
    'unlockedAchievements', v_unlocked_achievements
  );
END;
$$;


-- ==========================================================
-- 8. AUTHORITATIVE ATOMIC INVESTIGATION RPC
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
  v_req_chapter_clues INT := 0;
  v_target_chapter TEXT := 'ch_01';
  v_has_master_key BOOLEAN := FALSE;
  v_has_camera BOOLEAN := FALSE;
  v_bonus_xp INT := 0;
  v_unlocked_achievements JSONB;
BEGIN
  -- Security validation: Caller must be authenticated user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- 0.1 Backend Lock Enforcement: Cases beyond Case #001 require Case #001 to be solved
  IF p_case_id != 'case_001' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.case_progress
      WHERE user_id = p_user_id AND case_id = 'case_001' AND is_solved = TRUE
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Case Dossier Locked: Clearance restricted until Case #001 is solved.');
    END IF;
  END IF;

  -- 0.2 Authoritative Case Action Rules & Progression Requirements
  IF p_case_id = 'case_001' THEN
    IF p_action_id = 'act_01' THEN
      v_gold_cost := 60;
      v_yields_evidence_id := 'ev_01';
      v_req_attr_name := 'perception';
      v_req_attr_val := 3;
      v_target_chapter := 'ch_01';
      v_req_chapter_clues := 0;
    ELSIF p_action_id = 'act_08' THEN
      v_gold_cost := 40;
      v_yields_evidence_id := 'ev_02';
      v_req_attr_name := 'perception';
      v_req_attr_val := 2;
      v_target_chapter := 'ch_01';
      v_req_chapter_clues := 0;
    ELSIF p_action_id = 'act_03' THEN
      v_gold_cost := 50;
      v_yields_evidence_id := 'ev_03';
      v_req_attr_name := 'perception';
      v_req_attr_val := 3;
      v_target_chapter := 'ch_01';
      v_req_chapter_clues := 0;
    ELSIF p_action_id = 'act_02' THEN
      v_gold_cost := 80;
      v_yields_evidence_id := 'ev_04';
      v_req_attr_name := 'intelligence';
      v_req_attr_val := 3;
      v_alt_attr_name := 'discipline';
      v_alt_attr_val := 3;
      v_target_chapter := 'ch_01';
      v_req_chapter_clues := 0;
    ELSIF p_action_id = 'act_04' THEN
      v_gold_cost := 50;
      v_yields_evidence_id := 'ev_05';
      v_req_attr_name := 'perception';
      v_req_attr_val := 4;
      v_target_chapter := 'ch_02';
      v_req_chapter_clues := 3; -- Requires at least 3 clues from chapter 1
    ELSIF p_action_id = 'act_05' THEN
      v_gold_cost := 90;
      v_yields_evidence_id := 'ev_06';
      v_req_attr_name := 'discipline';
      v_req_attr_val := 3;
      v_alt_attr_name := 'intelligence';
      v_alt_attr_val := 3;
      v_target_chapter := 'ch_02';
      v_req_chapter_clues := 3;
    ELSIF p_action_id = 'act_06' THEN
      v_gold_cost := 70;
      v_yields_evidence_id := 'ev_07';
      v_req_attr_name := 'discipline';
      v_req_attr_val := 4;
      v_target_chapter := 'ch_03';
      v_req_chapter_clues := 5; -- Requires at least 5 clues from chapters 1 & 2
    ELSIF p_action_id = 'act_09' THEN
      v_gold_cost := 60;
      v_yields_evidence_id := 'ev_08';
      v_req_attr_name := 'intelligence';
      v_req_attr_val := 3;
      v_alt_attr_name := 'perception';
      v_alt_attr_val := 3;
      v_target_chapter := 'ch_03';
      v_req_chapter_clues := 5;
    ELSIF p_action_id = 'act_07' THEN
      v_gold_cost := 80;
      v_yields_evidence_id := 'ev_09';
      v_req_attr_name := 'perception';
      v_req_attr_val := 4;
      v_target_chapter := 'ch_03';
      v_req_chapter_clues := 5;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Invalid investigation action ID.');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Investigation case currently restricted or unsupported.');
  END IF;

  -- 1. Check current evidence count for chapter progression validation
  SELECT COUNT(*) INTO v_discovered_count
  FROM public.discovered_evidence
  WHERE user_id = p_user_id AND case_id = p_case_id;

  IF v_target_chapter = 'ch_02' AND v_discovered_count < 3 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Investigation Step Locked: Chapter 2 requires at least 3 discovered clues in Chapter 1.'
    );
  ELSIF v_target_chapter = 'ch_03' AND v_discovered_count < 5 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Investigation Step Locked: Chapter 3 requires at least 5 discovered clues across Chapters 1 & 2.'
    );
  END IF;

  IF v_discovered_count < v_req_chapter_clues THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Investigation Step Locked: Uncover more baseline scene clues before accessing this lead.'
    );
  END IF;

  -- 2. Concurrency Row Lock: Lock profile row
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Detective profile not found.');
  END IF;

  -- 3. Check Idempotency: Action already executed?
  SELECT * INTO v_existing
  FROM public.executed_actions
  WHERE user_id = p_user_id AND case_id = p_case_id AND action_id = p_action_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'alreadyExecuted', true,
      'gold', v_profile.gold,
      'yieldsEvidenceId', v_yields_evidence_id
    );
  END IF;

  -- 4. Server-Side Equipment Perk: Master Skeleton Key (15% Gold discount)
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

  -- 5. Authoritative Attribute Requirement Check
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

  -- 6. Server-Side Equipment Perk: Field Rangefinder Camera (+20 bonus XP for discovering evidence)
  SELECT EXISTS(
    SELECT 1 FROM public.user_inventory 
    WHERE user_id = p_user_id AND item_id = 'eq_field_camera' AND is_equipped = TRUE
  ) INTO v_has_camera;

  IF v_has_camera THEN
    v_bonus_xp := 20;
    PERFORM public.apply_xp_and_level_up(p_user_id, v_bonus_xp, 0, 'EQUIPMENT_PERK', 'eq_field_camera');
  END IF;

  -- 7. Deduct Gold & update evidence count on profile
  UPDATE public.profiles
  SET gold = gold - v_gold_cost,
      evidence_discovered_count = evidence_discovered_count + 1,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING gold INTO v_profile.gold;

  -- Log Gold deduction to ledger
  INSERT INTO public.reward_transactions (user_id, type, source_id, xp_delta, gold_delta)
  VALUES (p_user_id, 'INVESTIGATION_ACTION', p_action_id, 0, -v_gold_cost);

  -- 8. Record executed action
  INSERT INTO public.executed_actions (user_id, case_id, action_id, executed_at)
  VALUES (p_user_id, p_case_id, p_action_id, NOW())
  ON CONFLICT (user_id, case_id, action_id) DO NOTHING;

  -- 9. Record discovered evidence
  INSERT INTO public.discovered_evidence (user_id, case_id, evidence_id, board_x, board_y, discovered_at)
  VALUES (p_user_id, p_case_id, v_yields_evidence_id, 100 + (v_discovered_count * 80) % 600, 120 + ((v_discovered_count * 60) % 350), NOW())
  ON CONFLICT (user_id, case_id, evidence_id) DO NOTHING;

  -- 10. Update case progress and current chapter authoritatively
  v_discovered_count := v_discovered_count + 1;
  v_progress_pct := LEAST(95, ROUND((v_discovered_count::FLOAT / v_total_evidence) * 100));

  IF v_discovered_count >= 8 THEN
    v_target_chapter := 'ch_04';
  ELSIF v_discovered_count >= 5 THEN
    v_target_chapter := 'ch_03';
  ELSIF v_discovered_count >= 3 THEN
    v_target_chapter := 'ch_02';
  ELSE
    v_target_chapter := 'ch_01';
  END IF;

  INSERT INTO public.case_progress (user_id, case_id, current_chapter_id, progress_percentage, status, updated_at)
  VALUES (p_user_id, p_case_id, v_target_chapter, v_progress_pct, 'IN_PROGRESS', NOW())
  ON CONFLICT (user_id, case_id)
  DO UPDATE SET 
    current_chapter_id = CASE 
      WHEN EXCLUDED.current_chapter_id > case_progress.current_chapter_id THEN EXCLUDED.current_chapter_id 
      ELSE case_progress.current_chapter_id 
    END,
    progress_percentage = EXCLUDED.progress_percentage, 
    updated_at = NOW();

  -- 11. Check and award achievements server-side (e.g. ach_sharp_eyes for 5 clues)
  v_unlocked_achievements := public.check_and_unlock_achievements(p_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'gold', v_profile.gold,
    'yieldsEvidenceId', v_yields_evidence_id,
    'progressPercentage', v_progress_pct,
    'currentChapterId', v_target_chapter,
    'bonusXp', v_bonus_xp,
    'unlockedAchievements', v_unlocked_achievements
  );
END;
$$;


-- ==========================================================
-- 9. AUTHORITATIVE ATOMIC CASE SOLVING RPC (IDEMPOTENT & STRICT 500 XP / 250 GOLD)
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
  v_final_xp INT := p_reward_xp;
  v_final_gold INT := p_reward_gold;
  v_has_typewriter BOOLEAN := FALSE;
  v_lvl_res JSONB;
  v_unlocked_achievements JSONB;
  v_solved_at TIMESTAMPTZ := NOW();
BEGIN
  -- Security validation: Caller must be authenticated user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- 0.1 Prerequisite Check: Case #002 requires Case #001 to be solved
  IF p_case_id != 'case_001' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.case_progress
      WHERE user_id = p_user_id AND case_id = 'case_001' AND is_solved = TRUE
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Case Dossier Locked: Prerequisite Case #001 not solved');
    END IF;
  END IF;

  -- 0.2 Canonical Case Rewards (Case #001 strictly 500 XP + 250 Gold)
  IF p_case_id = 'case_001' THEN
    v_final_xp := 500;
    v_final_gold := 250;
  ELSIF p_case_id = 'case_002' THEN
    v_final_xp := 950;
    v_final_gold := 500;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or unsupported case ID');
  END IF;

  -- 1. Idempotency check: Already solved?
  SELECT * INTO v_case
  FROM public.case_progress
  WHERE user_id = p_user_id AND case_id = p_case_id
  FOR UPDATE;

  IF FOUND AND v_case.is_solved THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'alreadySolved', true,
      'rewards', jsonb_build_object('xp', v_final_xp, 'gold', v_final_gold),
      'profile', jsonb_build_object(
        'id', v_profile.id,
        'gold', v_profile.gold,
        'xp', v_profile.xp,
        'level', v_profile.level,
        'rank', v_profile.rank,
        'casesSolvedCount', v_profile.cases_solved_count
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

  -- 5. Apply canonical XP, Level, Rank, and Level-up Bonus
  v_lvl_res := public.apply_xp_and_level_up(p_user_id, v_final_xp, v_final_gold, 'CASE_SOLVED', p_case_id);

  -- 6. Check and award achievements server-side (ach_case_closed, ach_first_case)
  v_unlocked_achievements := public.check_and_unlock_achievements(p_user_id);

  -- Re-read latest profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'caseSolved', true,
    'rewards', jsonb_build_object('xp', v_final_xp, 'gold', v_final_gold),
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
      'casesSolvedCount', v_profile.cases_solved_count,
      'evidenceDiscoveredCount', v_profile.evidence_discovered_count
    ),
    'unlockedAchievements', v_unlocked_achievements
  );
END;
$$;


-- ==========================================================
-- 10. ATOMIC EQUIPMENT PURCHASE & EQUIP RPCS (WITH SLOT LIMITS)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.purchase_equipment_atomic(
  p_user_id UUID,
  p_item_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile RECORD;
  v_cost INT;
  v_equipped_count INT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate canonical equipment item and price
  IF p_item_id = 'eq_magnifying_glass' THEN v_cost := 120;
  ELSIF p_item_id = 'eq_field_camera' THEN v_cost := 250;
  ELSIF p_item_id = 'eq_chronograph_watch' THEN v_cost := 350;
  ELSIF p_item_id = 'eq_master_key' THEN v_cost := 450;
  ELSIF p_item_id = 'eq_trenchcoat' THEN v_cost := 600;
  ELSIF p_item_id = 'eq_antique_typewriter' THEN v_cost := 800;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid equipment item');
  END IF;

  -- 1. Concurrency Row Lock: Lock profile row first
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- 2. Check if already acquired
  IF EXISTS (SELECT 1 FROM public.user_inventory WHERE user_id = p_user_id AND item_id = p_item_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Equipment item already requisitioned');
  END IF;

  IF v_profile.gold < v_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough Gold for this equipment');
  END IF;

  -- 3. Deduct gold
  UPDATE public.profiles
  SET gold = gold - v_cost, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING gold INTO v_profile.gold;

  -- 4. Log purchase
  INSERT INTO public.reward_transactions (user_id, type, source_id, xp_delta, gold_delta)
  VALUES (p_user_id, 'EQUIPMENT_PURCHASE', p_item_id, 0, -v_cost);

  -- 5. Determine if it can be auto-equipped (slot limit: 3)
  SELECT COUNT(*) INTO v_equipped_count FROM public.user_inventory WHERE user_id = p_user_id AND is_equipped = TRUE;

  INSERT INTO public.user_inventory (user_id, item_id, is_equipped, acquired_at)
  VALUES (p_user_id, p_item_id, (v_equipped_count < 3), NOW())
  ON CONFLICT (user_id, item_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'itemId', p_item_id,
    'gold', v_profile.gold,
    'isEquipped', (v_equipped_count < 3)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_equip_item_atomic(
  p_user_id UUID,
  p_item_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inv RECORD;
  v_new_equipped BOOLEAN;
  v_equipped_count INT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_inv
  FROM public.user_inventory
  WHERE user_id = p_user_id AND item_id = p_item_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not owned');
  END IF;

  v_new_equipped := NOT v_inv.is_equipped;

  -- Enforce field kit limit: maximum 3 items equipped simultaneously
  IF v_new_equipped THEN
    SELECT COUNT(*) INTO v_equipped_count FROM public.user_inventory WHERE user_id = p_user_id AND is_equipped = TRUE;
    IF v_equipped_count >= 3 THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Equipment Limit Reached: A detective can equip a maximum of 3 field items simultaneously. Unequip an item first.'
      );
    END IF;
  END IF;

  UPDATE public.user_inventory
  SET is_equipped = v_new_equipped
  WHERE user_id = p_user_id AND item_id = p_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'itemId', p_item_id,
    'isEquipped', v_new_equipped
  );
END;
$$;


-- ==========================================================
-- 11. USER REGISTRATION TRIGGER (STARTER GEAR & CLEAN STREAK)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Create default profile with streak = 0
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    badge_id, 
    gold, 
    streak, 
    intelligence, 
    perception, 
    discipline, 
    resilience
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Detective ' || SUBSTRING(NEW.id::text, 1, 6)),
    'BADGE #' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0'),
    60,
    0,
    3,
    3,
    2,
    2
  );

  -- 2. Insert starter inventory: Brass Magnifying Glass equipped
  INSERT INTO public.user_inventory (user_id, item_id, is_equipped, acquired_at)
  VALUES (NEW.id, 'eq_magnifying_glass', TRUE, NOW())
  ON CONFLICT (user_id, item_id) DO NOTHING;

  -- 3. Initialize starter quest
  INSERT INTO public.tasks (user_id, title, description, category, difficulty, priority, xp_reward, gold_reward, attribute_rewards)
  VALUES (
    NEW.id,
    'COMPLETE FIRST CASEWORK',
    'Execute your first real-world task to earn Gold, XP, and initiate the Blackwood investigation.',
    'Discipline',
    'D',
    'HIGH',
    60,
    15,
    '{"discipline": 12}'::jsonb
  );

  -- 4. Initialize Case #001 progress
  INSERT INTO public.case_progress (user_id, case_id, current_chapter_id, status, progress_percentage, is_solved)
  VALUES (
    NEW.id,
    'case_001',
    'ch_01',
    'IN_PROGRESS',
    0,
    FALSE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
