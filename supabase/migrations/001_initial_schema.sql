-- ==========================================================
-- QUESTCHASE: "COMPLETE YOUR TASKS. FOLLOW THE CLUES. SOLVE THE CASE."
-- Supabase PostgreSQL Master Schema & Migrations
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / DETECTIVE STATS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Alex Thorne',
  badge_id TEXT NOT NULL DEFAULT 'BADGE #7429',
  email TEXT NOT NULL,
  rank TEXT NOT NULL DEFAULT 'ROOKIE',
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  xp_to_next_level INTEGER NOT NULL DEFAULT 100,
  gold INTEGER NOT NULL DEFAULT 60,
  streak INTEGER NOT NULL DEFAULT 1,
  last_active_date DATE DEFAULT CURRENT_DATE,
  intelligence INTEGER NOT NULL DEFAULT 3,
  perception INTEGER NOT NULL DEFAULT 3,
  discipline INTEGER NOT NULL DEFAULT 2,
  resilience INTEGER NOT NULL DEFAULT 2,
  tasks_completed_count INTEGER NOT NULL DEFAULT 0,
  cases_solved_count INTEGER NOT NULL DEFAULT 0,
  evidence_discovered_count INTEGER NOT NULL DEFAULT 0,
  settings JSONB DEFAULT '{"audioEnabled": true, "ambienceEnabled": true, "reducedMotion": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. QUESTS / CASEWORK DOCKET
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Discipline',
  difficulty TEXT NOT NULL DEFAULT 'B',
  priority TEXT NOT NULL DEFAULT 'HIGH',
  xp_reward INTEGER NOT NULL DEFAULT 120,
  gold_reward INTEGER NOT NULL DEFAULT 35,
  attribute_rewards JSONB DEFAULT '{"discipline": 18}'::jsonb,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER CASE PROGRESS
CREATE TABLE IF NOT EXISTS public.case_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL,
  current_chapter_id TEXT NOT NULL DEFAULT 'ch_01',
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  is_solved BOOLEAN NOT NULL DEFAULT FALSE,
  solved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, case_id)
);

-- 4. DISCOVERED EVIDENCE ITEMS
CREATE TABLE IF NOT EXISTS public.discovered_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL,
  evidence_id TEXT NOT NULL,
  board_x DOUBLE PRECISION DEFAULT 100,
  board_y DOUBLE PRECISION DEFAULT 100,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, case_id, evidence_id)
);

-- 5. EVIDENCE RED THREAD CONNECTIONS
CREATE TABLE IF NOT EXISTS public.evidence_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL,
  from_evidence_id TEXT NOT NULL,
  to_evidence_id TEXT NOT NULL,
  is_deduction_valid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, case_id, from_evidence_id, to_evidence_id)
);

-- 6. EXECUTED INVESTIGATION ACTIONS
CREATE TABLE IF NOT EXISTS public.executed_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, case_id, action_id)
);

-- 7. USER EQUIPMENT LOCKER / INVENTORY
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- 8. USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_id)
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executed_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks
CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- Case Progress
CREATE POLICY "Users can manage own case progress" ON public.case_progress FOR ALL USING (auth.uid() = user_id);

-- Discovered Evidence
CREATE POLICY "Users can manage own evidence" ON public.discovered_evidence FOR ALL USING (auth.uid() = user_id);

-- Evidence Connections
CREATE POLICY "Users can manage own connections" ON public.evidence_connections FOR ALL USING (auth.uid() = user_id);

-- Executed Actions
CREATE POLICY "Users can manage own actions" ON public.executed_actions FOR ALL USING (auth.uid() = user_id);

-- Inventory
CREATE POLICY "Users can manage own inventory" ON public.user_inventory FOR ALL USING (auth.uid() = user_id);

-- Achievements
CREATE POLICY "Users can manage own achievements" ON public.user_achievements FOR ALL USING (auth.uid() = user_id);

-- ==========================================================
-- TRIGGER: Automatic User Setup on Signup
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, badge_id, gold, intelligence, perception, discipline, resilience)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Detective ' || SUBSTRING(NEW.id::text, 1, 6)),
    'BADGE #' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0'),
    60,
    3,
    3,
    2,
    2
  );

  -- Initialize starter quest
  INSERT INTO public.tasks (user_id, title, description, category, difficulty, priority, xp_reward, gold_reward, attribute_rewards)
  VALUES (
    NEW.id,
    'COMPLETE FIRST CASEWORK',
    'Execute your first real-world task to earn Gold, XP, and initiate the Blackwood investigation.',
    'Discipline',
    'D',
    'HIGH',
    60,
    20,
    '{"discipline": 12}'::jsonb
  );

  -- Initialize Case #001 progress (unsolved)
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- RPC 1: ATOMIC QUEST COMPLETION
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
  v_new_xp INT;
  v_new_level INT;
  v_xp_to_next INT;
  v_did_level_up BOOLEAN := FALSE;
  v_old_level INT;
  v_new_rank TEXT;
  v_today DATE := CURRENT_DATE;
  v_last_active DATE;
  v_streak INT;
  v_diff_days INT;
  v_intelligence_gain INT := 0;
  v_perception_gain INT := 0;
  v_discipline_gain INT := 0;
  v_resilience_gain INT := 0;
  v_completed_at TIMESTAMPTZ := NOW();
BEGIN
  -- 0. Security validation: Caller must be the authenticated user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- 1. Lock and fetch task
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quest not found or unauthorized');
  END IF;

  -- 2. Idempotency check: if already completed, return without re-awarding
  IF v_task.is_completed THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'alreadyCompleted', true,
      'message', 'Quest already completed',
      'task', row_to_json(v_task),
      'profile', row_to_json(v_profile),
      'levelUp', null
    );
  END IF;

  -- 3. Lock and fetch profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Detective profile not found');
  END IF;

  -- 4. Mark task completed
  UPDATE public.tasks
  SET is_completed = TRUE,
      completed_at = v_completed_at,
      updated_at = v_completed_at
  WHERE id = p_task_id;

  -- 5. Calculate rewards
  v_xp_reward := COALESCE(v_task.xp_reward, 60);
  v_gold_reward := COALESCE(v_task.gold_reward, 20);
  v_attr_rewards := COALESCE(v_task.attribute_rewards, '{}'::jsonb);

  v_intelligence_gain := COALESCE((v_attr_rewards->>'intelligence')::INT, 0);
  v_perception_gain := COALESCE((v_attr_rewards->>'perception')::INT, 0);
  v_discipline_gain := COALESCE((v_attr_rewards->>'discipline')::INT, 0);
  v_resilience_gain := COALESCE((v_attr_rewards->>'resilience')::INT, 0);

  -- 6. Calculate Level / XP
  v_old_level := v_profile.level;
  v_new_level := v_profile.level;
  v_new_xp := v_profile.xp + v_xp_reward;
  v_xp_to_next := COALESCE(v_profile.xp_to_next_level, ROUND(100 * POWER(v_new_level, 1.35)));

  WHILE v_new_xp >= v_xp_to_next LOOP
    v_new_xp := v_new_xp - v_xp_to_next;
    v_new_level := v_new_level + 1;
    v_xp_to_next := ROUND(100 * POWER(v_new_level, 1.35));
    v_did_level_up := TRUE;
  END LOOP;

  -- Rank progression
  IF v_new_level >= 15 THEN v_new_rank := 'MASTER DETECTIVE';
  ELSIF v_new_level >= 12 THEN v_new_rank := 'CHIEF INVESTIGATOR';
  ELSIF v_new_level >= 10 THEN v_new_rank := 'SENIOR INVESTIGATOR';
  ELSIF v_new_level >= 8 THEN v_new_rank := 'SPECIALIST';
  ELSIF v_new_level >= 6 THEN v_new_rank := 'INSPECTOR';
  ELSIF v_new_level >= 4 THEN v_new_rank := 'INVESTIGATOR';
  ELSIF v_new_level >= 2 THEN v_new_rank := 'DETECTIVE';
  ELSE v_new_rank := 'ROOKIE';
  END IF;

  -- 7. Calculate Streak
  v_last_active := COALESCE(v_profile.last_active_date, v_today);
  v_streak := COALESCE(v_profile.streak, 1);
  v_diff_days := v_today - v_last_active;

  IF v_diff_days = 1 THEN
    v_streak := v_streak + 1;
  ELSIF v_diff_days > 1 THEN
    v_streak := 1;
  END IF;

  -- 8. Commit Profile Update
  UPDATE public.profiles
  SET xp = v_new_xp,
      level = v_new_level,
      xp_to_next_level = v_xp_to_next,
      gold = v_profile.gold + v_gold_reward + (CASE WHEN v_did_level_up THEN 50 ELSE 0 END),
      rank = v_new_rank,
      streak = v_streak,
      last_active_date = v_today,
      intelligence = v_profile.intelligence + v_intelligence_gain,
      perception = v_profile.perception + v_perception_gain,
      discipline = v_profile.discipline + v_discipline_gain,
      resilience = v_profile.resilience + v_resilience_gain,
      tasks_completed_count = v_profile.tasks_completed_count + 1,
      updated_at = v_completed_at
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

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
    'levelUp', CASE WHEN v_did_level_up THEN
      jsonb_build_object(
        'didLevelUp', true,
        'oldLevel', v_old_level,
        'newLevel', v_new_level,
        'rank', v_new_rank,
        'bonusGold', 50
      )
    ELSE NULL END
  );
END;
$$;

-- ==========================================================
-- ==========================================================
-- RPC 2: ATOMIC INVESTIGATION ACTION EXECUTION
-- ==========================================================
CREATE OR REPLACE FUNCTION public.execute_investigation_action_atomic(
  p_user_id UUID,
  p_case_id TEXT,
  p_action_id TEXT,
  p_gold_cost INT DEFAULT NULL,
  p_yields_evidence_id TEXT DEFAULT NULL,
  p_total_case_evidence INT DEFAULT NULL
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
  v_total_evidence INT;
BEGIN
  -- 0. Security validation: Caller must be the authenticated user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- 0.1 Backend Lock Enforcement: Cases beyond Case #001 require Case #001 to be solved
  IF p_case_id != 'case_001' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.case_progress
      WHERE user_id = p_user_id AND case_id = 'case_001' AND is_solved = TRUE
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Case Dossier Locked: Prerequisite Case #001 not solved');
    END IF;
  END IF;

  -- 0.2 Derive and strictly validate canonical action parameters server-side
  IF p_case_id = 'case_001' THEN
    IF p_action_id = 'act_01' THEN
      v_gold_cost := 60;
      v_yields_evidence_id := 'ev_01';
    ELSIF p_action_id = 'act_02' THEN
      v_gold_cost := 80;
      v_yields_evidence_id := 'ev_04';
    ELSIF p_action_id = 'act_03' THEN
      v_gold_cost := 50;
      v_yields_evidence_id := 'ev_03';
    ELSIF p_action_id = 'act_04' THEN
      v_gold_cost := 50;
      v_yields_evidence_id := 'ev_05';
    ELSIF p_action_id = 'act_05' THEN
      v_gold_cost := 90;
      v_yields_evidence_id := 'ev_06';
    ELSIF p_action_id = 'act_06' THEN
      v_gold_cost := 70;
      v_yields_evidence_id := 'ev_07';
    ELSIF p_action_id = 'act_07' THEN
      v_gold_cost := 80;
      v_yields_evidence_id := 'ev_09';
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Invalid investigation action for this case');
    END IF;
    v_total_evidence := 9;
  ELSE
    RETURN jsonb_build_object(
    'success', false,
    'error', 'Invalid or unsupported investigation case'
  );
  END IF;

  -- 1. CRITICAL CONCURRENCY LOCK: Lock the profile row FIRST to prevent simultaneous double-charging
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- 2. Check idempotency WHILE HOLDING THE USER LOCK: has this action already been executed?
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

  -- 3. Check Gold balance
  IF v_profile.gold < v_gold_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient Gold');
  END IF;

  -- 4. Deduct Gold & increment evidence count
  UPDATE public.profiles
  SET gold = gold - v_gold_cost,
      evidence_discovered_count = evidence_discovered_count + 1,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING gold INTO v_profile.gold;

  -- 5. Record action execution
  INSERT INTO public.executed_actions (user_id, case_id, action_id, executed_at)
  VALUES (p_user_id, p_case_id, p_action_id, NOW())
  ON CONFLICT (user_id, case_id, action_id) DO NOTHING;

  -- 6. Record evidence discovery
  INSERT INTO public.discovered_evidence (user_id, case_id, evidence_id, board_x, board_y, discovered_at)
  VALUES (p_user_id, p_case_id, v_yields_evidence_id, 100 + RANDOM() * 200, 100 + RANDOM() * 150, NOW())
  ON CONFLICT (user_id, case_id, evidence_id) DO NOTHING;

  -- 7. Update case progress
  SELECT COUNT(*) INTO v_discovered_count
  FROM public.discovered_evidence
  WHERE user_id = p_user_id AND case_id = p_case_id;

  v_progress_pct := LEAST(95, ROUND((v_discovered_count::FLOAT / GREATEST(1, v_total_evidence)) * 100));

  INSERT INTO public.case_progress (user_id, case_id, progress_percentage, status, updated_at)
  VALUES (p_user_id, p_case_id, v_progress_pct, 'IN_PROGRESS', NOW())
  ON CONFLICT (user_id, case_id)
  DO UPDATE SET progress_percentage = EXCLUDED.progress_percentage, updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'gold', v_profile.gold,
    'yieldsEvidenceId', v_yields_evidence_id,
    'progressPercentage', v_progress_pct
  );
END;
$$;

-- ==========================================================
-- RPC 3: ATOMIC CASE SOLVING
-- ==========================================================
CREATE OR REPLACE FUNCTION public.solve_case_atomic(
  p_user_id UUID,
  p_case_id TEXT,
  p_reward_xp INT DEFAULT NULL,
  p_reward_gold INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_case RECORD;
  v_profile RECORD;
  v_reward_xp INT;
  v_reward_gold INT;
  v_new_xp INT;
  v_new_level INT;
  v_xp_to_next INT;
  v_did_level_up BOOLEAN := FALSE;
  v_solved_at TIMESTAMPTZ := NOW();
BEGIN
  -- 0. Security validation: Caller must be the authenticated user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match authenticated user';
  END IF;

  -- 0.1 Backend Lock Enforcement: Cases beyond Case #001 require Case #001 to be solved
  IF p_case_id != 'case_001' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.case_progress
      WHERE user_id = p_user_id AND case_id = 'case_001' AND is_solved = TRUE
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Case Dossier Locked: Prerequisite Case #001 not solved');
    END IF;
  END IF;

  -- 0.2 Derive and strictly enforce server-authoritative case rewards
  IF p_case_id = 'case_001' THEN
    v_reward_xp := 500;
    v_reward_gold := 250;
  ELSIF p_case_id = 'case_002' THEN
    v_reward_xp := 950;
    v_reward_gold := 500;
  ELSE
    RETURN jsonb_build_object(
    'success', false,
    'error', 'Invalid or unsupported case'
  );
  END IF;

  -- 1. Check idempotency: already solved?
  SELECT * INTO v_case
  FROM public.case_progress
  WHERE user_id = p_user_id AND case_id = p_case_id
  FOR UPDATE;

  IF FOUND AND v_case.is_solved THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'alreadySolved', true,
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
      )
    );
  END IF;

  -- 2. Mark case solved
  INSERT INTO public.case_progress (user_id, case_id, is_solved, status, progress_percentage, solved_at, updated_at)
  VALUES (p_user_id, p_case_id, TRUE, 'SOLVED', 100, v_solved_at, v_solved_at)
  ON CONFLICT (user_id, case_id)
  DO UPDATE SET is_solved = TRUE, status = 'SOLVED', progress_percentage = 100, solved_at = v_solved_at, updated_at = v_solved_at;

  -- 3. Lock profile and award rewards
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  v_new_level := v_profile.level;
  v_new_xp := v_profile.xp + v_reward_xp;
  v_xp_to_next := COALESCE(v_profile.xp_to_next_level, ROUND(100 * POWER(v_new_level, 1.35)));

  WHILE v_new_xp >= v_xp_to_next LOOP
    v_new_xp := v_new_xp - v_xp_to_next;
    v_new_level := v_new_level + 1;
    v_xp_to_next := ROUND(100 * POWER(v_new_level, 1.35));
    v_did_level_up := TRUE;
  END LOOP;

  UPDATE public.profiles
  SET xp = v_new_xp,
      level = v_new_level,
      xp_to_next_level = v_xp_to_next,
      gold = gold + v_reward_gold,
      cases_solved_count = cases_solved_count + 1,
      updated_at = v_solved_at
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  RETURN jsonb_build_object(
    'success', true,
    'caseSolved', true,
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
    )
  );
END;
$$;

-- ==========================================================
-- RESTRICT RPC EXECUTE PERMISSIONS
-- ==========================================================
REVOKE EXECUTE ON FUNCTION public.complete_quest_atomic(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.execute_investigation_action_atomic(UUID, TEXT, TEXT, INT, TEXT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.solve_case_atomic(UUID, TEXT, INT, INT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.complete_quest_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_investigation_action_atomic(UUID, TEXT, TEXT, INT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.solve_case_atomic(UUID, TEXT, INT, INT) TO authenticated;

