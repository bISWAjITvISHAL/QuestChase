# QUESTCHASE

> **"Complete your quests. Follow the clues. Solve the case."**

---

## 1. Product Concept

**QuestChase** is a gamified productivity application designed as a premium cinematic detective murder-mystery game.

Instead of presenting real-world to-do items as mundane tasks, QuestChase turns them into high-stakes investigative quests.

### The Central Gameplay Loop:
$$\text{REAL-LIFE TASK} \rightarrow \text{QUEST} \rightarrow \text{COMPLETION} \rightarrow \text{XP + GOLD + ATTRIBUTE XP} \rightarrow \text{INVESTIGATION} \rightarrow \text{CLUES} \rightarrow \text{EVIDENCE} \rightarrow \text{DEDUCTION} \rightarrow \text{CASE SOLVED}$$

**The user's real-life productivity literally powers the forensic murder-mystery investigation.**

---

## 2. Full-Stack Architecture & Data Persistence

In compliance with hackathon rules, **localStorage is NOT used as primary storage**. 

**Supabase / PostgreSQL** is the single authoritative source of persistent game state.

### Architecture Flow:
$$\text{Supabase PostgreSQL} \xrightarrow{\text{RLS Policies}} \text{Authenticated Next.js Server API} \xrightarrow{\text{Bearer JWT}} \text{Client Data Layer} \rightarrow \text{Zustand (In-Memory Session State)} \rightarrow \text{Tactile UI / 3D Canvas}$$

### Authoritative Persistent Entities in PostgreSQL:
1. **Profiles (`profiles`)**: Detective name, badge ID, level, non-linear XP, Gold, streak, 4 attributes, solve counters. Direct client mutation prohibited via trigger `protect_profile_gameplay_columns`.
2. **Quests (`tasks`)**: User-scoped real-world tasks with server-calculated rewards and completion timestamps.
3. **Case Progress (`case_progress`)**: Active chapter, completion percentage, solved state, with database range constraint `0 <= progress_percentage <= 100`.
4. **Discovered Evidence (`discovered_evidence`)**: Unlocked forensic clues and 2D/3D board coordinates ($X, Y$).
5. **Executed Actions (`executed_actions`)**: Idempotent records of paid forensic examinations.
6. **Evidence Connections (`evidence_connections`)**: Red yarn links and verified contradiction flags (connecting undiscovered clues is strictly prevented by server validation).
7. **Equipment & Inventory (`user_inventory`)**: Requisitioned forensic gear and active field kit loadout (enforces max 3 equipped items).
8. **Achievements (`user_achievements`)**: Canonical detective achievements evaluated strictly from real database records via `check_and_unlock_achievements`.
9. **Reward Transactions Audit Ledger (`reward_transactions`)**: Append-only transactional audit trail recording every XP and Gold credit and debit with source attribution (`QUEST_COMPLETION`, `INVESTIGATION_ACTION`, `CASE_SOLVED`, `ACHIEVEMENT_UNLOCKED`, `LEVEL_UP_BONUS`, `EQUIPMENT_PERK`). Strict RLS blocks client inserts/updates.

---

## 3. Real Supabase Authentication & Row-Level Security (RLS)

- **Identity Provider**: Supabase Auth (JWT tokens, password encryption, automatic session management).
- **Protected Routes**: `/desk`, `/headquarters`, `/tasks`, `/investigate/[caseId]`, `/board/[caseId]`, `/character`, `/locker`, `/cases`, `/achievements`, `/settings`.
- **Row-Level Security**: Every table enforces strict `auth.uid() = user_id` or `auth.uid() = id`.
- **Client Mutation Lockdown**: Direct client `UPDATE` on gameplay-critical profile columns (`xp`, `gold`, `level`, `rank`, `streak`, `attributes`) is blocked at the database engine level via the `protect_profile_gameplay_columns` PostgreSQL trigger.
- **Transaction-Atomic RPCs**: All gameplay state mutations execute through secure `SECURITY DEFINER` stored procedures running inside atomic database transactions with row-level locks (`FOR UPDATE`):
  - `complete_quest_atomic`: Date-based streak calculation, attribute XP rewards, non-linear level curve calculation, +50 Gold level-up bonuses, equipment perk boosts (`eq_trenchcoat` +20% gold, `eq_magnifying_glass` +15% perception growth), and automatic achievement checks.
  - `execute_investigation_action_atomic`: Scene object action execution with attribute requirement verification inside the RPC, chapter progression gates, gold deduction, equipment discounts (`eq_master_key` 15% discount, `eq_field_camera` +20 bonus XP), and ledger logging.
  - `solve_case_atomic`: Canonical case solution commit with strict 500 XP / 250 Gold rewards (with `eq_antique_typewriter` +50% Gold bonus), complete idempotency, and audit logging.
  - `purchase_equipment_atomic` & `toggle_equip_item_atomic`: Persistent armory inventory management with strict 3-item field kit limit enforcement.
  - `check_and_unlock_achievements`: Server-authoritative achievement verification evaluating real database records across tasks, evidence, case progress, and connections—completely eliminating client-side self-awarding.

---

## 4. Zero Solution Leakage & Integrity Model

- **No Client Secrets**: Case solutions, culprit suspect identities (`isCulprit`), required clue IDs, and final deduction pillars are completely stripped from client bundles, client TypeScript types, and public API responses.
- **Server-Only Validation**: Final accusations are processed by `src/lib/serverCaseSolutions.ts` on the server using deterministic identifier matching (`whoId`, `whenId`, `howId`, `whyId`).
- **Prerequisite Case Gating**: Case #002 (The Silent Witness) is strictly locked on both backend APIs and the client interface until Case #001 (The Blackwood Murder) is officially solved.

---

## 5. Core Game & Economy Mechanics

### 1. The 4 Canonical Attributes:
- **INTELLIGENCE**: Powers digital forensics, laptop data recovery, and pattern recognition.
- **PERCEPTION**: Powers physical crime scene searches, micro-clues, and fingerprint matching.
- **DISCIPLINE**: Powers interrogation, alibi deconstruction, and timeline reconstruction.
- **RESILIENCE**: Powers high-pressure interrogation composure, mental fortitude, and undercover endurance.

### 2. Difficulty Tiers & Server Reward Progression:
- **Tier E**: +40 XP, +10 Gold, +8 Attribute XP
- **Tier D**: +60 XP, +15 Gold, +12 Attribute XP
- **Tier C**: +80 XP, +20 Gold, +15 Attribute XP
- **Tier B**: +120 XP, +35 Gold, +18 Attribute XP
- **Tier A**: +180 XP, +50 Gold, +25 Attribute XP

### 3. Non-Linear Level Curve:
$$\text{XP Required for Level } L = \text{round}(100 \times L^{1.35})$$

### 4. Gold Economy & Forensic Actions:
Gold is the primary fuel for investigation actions:
- *Search The Study* (60 Gold, Perception 3)
- *Analyze Laptop* (80 Gold, Intelligence 3 or Discipline 3)
- *Examine Wall Safe* (50 Gold, Perception 3)
- *Search Garden* (50 Gold, Perception 4)
- *Reconstruct Timeline* (90 Gold, Discipline 3 or Intelligence 3)
- *Interview Marcus Vance* (70 Gold, Discipline 4)
- *Inspect Library & Dispensary* (80 Gold, Perception 4)

---

## 6. Case #001: The Blackwood Murder

- **Victim**: Lord Arthur Blackwood (Found dead at mahogany desk at 22:45 PM).
- **Starting State**: Starts **completely unsolved** (0 pre-discovered clues, unexecuted actions).
- **Suspects**:
  1. *Marcus Vance* (Nephew & Primary Estate Executor)
  2. *Dr. Elena Sterling* (Personal Physician & Toxicologist)
  3. *Victor Ward* (Business Partner & Ironworks Director)
  4. *Clara Giles* (Estate Archivist & Secret Heiress)
- **Key Contradiction**: Marcus testifies he departed the estate at 22:00 PM, but the Gatekeeper Logbook officially recorded his carriage departing at 22:31 PM.
- **Murder Method**: Potassium cyanide laced into Lord Arthur's fountain pen nib and crystal scotch tumbler.
- **Motive**: Interception of codicil transferring 80% shares to Clara Giles and urgent debt to dockside bookmakers.
- **Canonical Reward**: Authoritative **500 XP and 250 Gold** upon verified accusation.

---

## 7. Technology Stack

- **Framework**: Next.js 14 (App Router, Server Actions, Route Handlers, TypeScript)
- **Database & Auth**: PostgreSQL / Supabase with Row-Level Security (RLS) & Atomic Stored Procedures
- **Styling**: Tailwind CSS + Custom Tactile Noir Design System
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Audio Engine**: Zero-dependency Web Audio API procedural synthesizer (typewriter clicks, stamp impact, paper rustle, yarn snap, rain ambience)
- **State Management**: Zustand (in-memory active session layer with server synchronization)
- **Animations**: Canvas-Confetti, CSS Keyframe Stamp Animations, Speedometer Gauge Needle Transitions

---

## 8. Setup & Running Locally

### Prerequisites:
- Node.js 18+ or 20+
- npm
- Supabase account (or local PostgreSQL instance)

### Installation:
```bash
# 1. Clone the repository
git clone https://github.com/your-repo/QuestChase.git
cd QuestChase

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Apply Database Migrations (in order):
# 4a. Run supabase/migrations/001_initial_schema.sql in your Supabase SQL Editor
# 4b. Run supabase/migrations/002_security_and_game_integrity.sql in your Supabase SQL Editor

# 5. Start local development server
npm run dev
```

Visit `http://localhost:3000` to launch QuestChase!

### Production Build:
```bash
npm run build
npm start
```

---

## 9. License

MIT License. Built for the Web Hackathon.
