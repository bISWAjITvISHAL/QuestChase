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
1. **Profiles (`profiles`)**: Detective name, badge ID, level, non-linear XP, Gold, streak, 4 attributes, solve counters.
2. **Quests (`tasks`)**: User-scoped real-world tasks with server-calculated rewards and completion timestamps.
3. **Case Progress (`case_progress`)**: Active chapter, completion percentage, solved state.
4. **Discovered Evidence (`discovered_evidence`)**: Unlocked forensic clues and 2D/3D board coordinates ($X, Y$).
5. **Executed Actions (`executed_actions`)**: Idempotent records of paid forensic examinations.
6. **Evidence Connections (`evidence_connections`)**: Red yarn links and verified contradiction flags.
7. **Equipment & Achievements (`user_inventory`, `user_achievements`)**: Requisitioned forensic gear and badges.

---

## 3. Real Supabase Authentication & Row-Level Security (RLS)

- **Identity Provider**: Supabase Auth (JWT tokens, password encryption, automatic session management).
- **Protected Routes**: `/desk`, `/tasks`, `/investigate/[caseId]`, `/board/[caseId]`, `/character`, `/locker`, `/cases`, `/achievements`.
- **Row-Level Security**: Every table enforces `auth.uid() = user_id` or `auth.uid() = id`. Users can strictly view and modify only their own detective data across all devices.

---

## 4. Core Game & Economy Mechanics

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

## 5. Case #001: The Blackwood Murder

- **Victim**: Lord Arthur Blackwood (Found dead at mahogany desk at 22:45 PM).
- **Starting State**: Starts **completely unsolved** (0 pre-discovered clues, unexecuted actions).
- **Suspects**:
  1. *Marcus Vance* (Nephew & Executor — Culprit)
  2. *Dr. Elena Sterling* (Personal Physician)
  3. *Victor Ward* (Ironworks Director)
  4. *Clara Giles* (Estate Archivist & Secret Heiress)
- **Key Contradiction**: Marcus testifies he departed the estate at 22:00 PM, but the Gatekeeper Logbook officially recorded his departure at 22:31 PM.
- **Murder Method**: Potassium cyanide laced into Lord Arthur's fountain pen nib and crystal scotch tumbler.
- **Motive**: Interception of codicil transferring 80% shares to Clara Giles and urgent debt to dockside bookmakers.
- **4-Pillar Accusation Validation**: Final deduction rigorously validates **WHO** (Marcus Vance), **WHEN** (22:25 PM), **HOW** (Cyanide pen/tumbler), and **WHY** (Disinheritance & gambling debt).

---

## 6. Technology Stack

- **Framework**: Next.js 14 (App Router, Server Actions, Route Handlers, TypeScript)
- **Database & Auth**: PostgreSQL / Supabase with Row-Level Security (RLS)
- **Styling**: Tailwind CSS + Custom Tactile Noir Design System
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Audio Engine**: Zero-dependency Web Audio API procedural synthesizer (typewriter clicks, stamp impact, paper rustle, yarn snap, rain ambience)
- **State Management**: Zustand (in-memory active session layer with server synchronization)
- **Animations**: Canvas-Confetti, CSS Keyframe Stamp Animations, Speedometer Gauge Needle Transitions

---

## 7. Setup & Running Locally

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

# 4. Apply Database Migrations
# Run supabase/migrations/001_initial_schema.sql in your Supabase SQL Editor

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

## 8. License

MIT License. Built for the Web Hackathon.
