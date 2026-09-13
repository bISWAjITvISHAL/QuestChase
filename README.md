# QuestChase

> **Complete your quests. Follow the clues. Solve the case.**

QuestChase is a full-stack **gamified productivity + detective mystery RPG**. It converts real-world tasks into quests, rewards users with XP and Gold, and uses those rewards to unlock forensic investigations, evidence, deductions, equipment, achievements, and case progression.

## Live Demo

**Production:** https://quest-chase.vercel.app/

## Demo Credentials

Use the following account to explore the deployed application:

| Field    | Demo Value          |
| -------- | ------------------- |
| Email    | `test123@gmail.com` |
| Password | `test123456`        |

---

# Table of Contents

* [Overview](#overview)
* [Core Gameplay Loop](#core-gameplay-loop)
* [Features](#features)
* [Application Structure](#application-structure)
* [Architecture](#architecture)
* [Technology Stack](#technology-stack)
* [Frontend](#frontend)
* [Backend and API](#backend-and-api)
* [Database and Security](#database-and-security)
* [Game Systems](#game-systems)
* [Case Investigation](#case-investigation)
* [3D and Audio Systems](#3d-and-audio-systems)
* [Project File Structure](#project-file-structure)
* [Environment Variables](#environment-variables)
* [Local Development](#local-development)
* [Database Setup](#database-setup)
* [Build and Deployment](#build-and-deployment)
* [Available Scripts](#available-scripts)
* [Security and Integrity](#security-and-integrity)
* [Future Scope](#future-scope)

---

# Overview

QuestChase combines productivity software with an RPG-style progression system and a detective investigation experience.

Instead of treating a to-do list as a normal checklist, QuestChase turns real-world productivity into a detective RPG.

```text
Real-world goal
      ↓
     Quest
      ↓
Complete the quest
      ↓
   XP + Gold
      ↓
Character progression
      ↓
Spend Gold on investigation
      ↓
Discover evidence
      ↓
Connect evidence
      ↓
Make a deduction
      ↓
Solve the case
```

The application currently centers around **Case #001 — The Blackwood Murder**.

---

# Core Gameplay Loop

## 1. Create a Quest

Users can create real-world tasks with:

* Title
* Description
* Category
* Difficulty
* Priority
* Due date

## 2. Complete the Quest

Completing a quest updates the user's authoritative game state on the backend.

Rewards are calculated from the task's difficulty rather than trusting reward values sent by the browser.

## 3. Earn XP, Gold and Attribute Progress

Quest completion can provide:

* XP
* Gold
* Attribute progression
* Streak progression
* Level progression
* Achievement progress

## 4. Investigate

Gold can be used to perform investigation actions in the crime scene.

Investigation actions may require:

* Gold
* Detective rank
* Intelligence
* Perception
* Discipline
* Resilience
* Chapter progression

## 5. Discover Evidence

Investigation actions unlock evidence items.

Evidence can include:

* Physical evidence
* Documents
* Digital evidence
* Testimony
* Timeline information
* Contradictions

## 6. Build the Evidence Board

Discovered evidence can be positioned and connected on the investigation board.

The board uses visual connections to represent relationships between clues.

## 7. Make the Final Deduction

The final accusation uses four deduction pillars:

* **WHO**
* **WHEN**
* **HOW**
* **WHY**

The server validates the canonical answer and verifies that the required supporting evidence was actually discovered.

## 8. Solve the Case

A correct solution awards the case reward and prevents duplicate rewards.

---

# Features

## Productivity / Quest System

* Create quests
* Edit quests
* Delete quests
* Complete quests
* Difficulty-based rewards
* Priority system
* Category-based attribute progression
* Due dates
* Daily streak tracking
* XP progression
* Gold economy

## Detective RPG System

QuestChase contains four core attributes:

| Attribute    | Gameplay Role                                          |
| ------------ | ------------------------------------------------------ |
| Intelligence | Digital forensics, analysis and pattern recognition    |
| Perception   | Physical evidence and crime-scene investigation        |
| Discipline   | Interrogation, timeline reconstruction and consistency |
| Resilience   | High-pressure investigation and endurance              |

The player also has:

* Level
* Rank
* XP
* Gold
* Streak
* Completed quest count
* Solved case count
* Discovered evidence count
* Equipment
* Achievements

## Investigation System

* Interactive 3D crime scene
* Investigation hotspots
* Gold-based forensic actions
* Attribute requirements
* Chapter gating
* Evidence discovery
* Investigation reports
* Evidence board
* Red-thread connections
* Contradiction detection
* Final accusation system

## Equipment / Locker

The application includes an equipment system where users can acquire and equip detective equipment.

Equipment can provide gameplay perks such as:

* Additional Gold
* Additional attribute growth
* Investigation discounts
* Bonus XP
* Case-solution bonuses

## Achievements

Achievements are evaluated from authoritative game state rather than simply trusting client-side progress.

Achievement categories include:

* Investigation
* Productivity
* Deduction
* Mastery

## Cinematic UI

QuestChase uses a detective-noir visual language with:

* Dossier-style panels
* Parchment textures
* Crimson accents
* Gold highlights
* Cinematic typography
* Animated transitions
* Level-up cinematics
* Case-solved cinematics
* Toast notifications
* Animated progress bars
* Animated numbers
* Confetti effects
* Typewriter-style audio effects

---

# Application Structure

```text
QuestChase
│
├── Landing Page
│   └── Product introduction / gameplay overview
│
├── Authentication
│   ├── Login
│   └── Register
│
├── Detective Headquarters
│   ├── Tasks / Quests
│   ├── Character
│   ├── Cases
│   ├── Locker
│   └── Achievements
│
├── Investigation
│   ├── Case dossier
│   ├── 3D crime scene
│   ├── Investigation actions
│   ├── Evidence discovery
│   └── Chapter progression
│
└── Evidence Board
    ├── Evidence cards
    ├── Evidence positioning
    ├── Red-thread connections
    └── Final accusation
```

---

# Architecture

QuestChase follows a client/server architecture using Next.js and Supabase.

```text
                         ┌─────────────────────┐
                         │   Next.js Frontend  │
                         │ React + TypeScript  │
                         └──────────┬──────────┘
                                    │
                         Zustand / API Client
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Next.js Route APIs  │
                         │ /api/...            │
                         └──────────┬──────────┘
                                    │
                              Authenticated
                              Supabase session
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Supabase PostgreSQL │
                         │ RLS + RPC Functions │
                         └──────────┬──────────┘
                                    │
                         Authoritative game state
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Player Progression  │
                         │ Quests / Evidence   │
                         │ Inventory / Cases   │
                         └─────────────────────┘
```

### Client Responsibilities

The React client handles:

* Rendering
* Navigation
* Animation
* 3D scenes
* Interaction
* Local UI state
* Audio effects
* User interface presentation

### Server Responsibilities

The server/database handles authoritative:

* Authentication checks
* Quest completion
* XP rewards
* Gold rewards
* Attribute progression
* Streak calculation
* Investigation purchases
* Evidence discovery
* Evidence connections
* Equipment purchases/equipping
* Achievement unlocking
* Case solving

---

# Technology Stack

## Core Framework

### Next.js

**Version:** `14.2.23`

Used for:

* App Router
* React Server/Client Components
* Route Handlers
* Middleware
* Server-side functionality
* Application routing

## Frontend

### React

**Version:** `18.3.1`

Used for building the application's component-based user interface.

### TypeScript

**Version:** `5.4.5`

Used for:

* Type safety
* Game models
* API types
* Component props
* Application logic

### Tailwind CSS

**Version:** `3.4.4`

Used for:

* Responsive UI
* Styling
* Layout
* Custom detective/noir design system
* Animations and visual effects

### PostCSS

**Version:** `8.4.38`

Used as part of the CSS processing pipeline.

### Autoprefixer

**Version:** `10.4.19`

Used for browser-compatible CSS output.

---

# State Management

## Zustand

**Version:** `4.5.2`

Zustand is used for client-side state management.

It manages application state including:

* Player profile
* Tasks
* Cases
* Evidence
* Equipment
* Achievements
* Notifications
* UI state
* Cinematic state

---

# Backend and Database

## Supabase

QuestChase uses Supabase for backend infrastructure.

Packages:

```text
@supabase/supabase-js
@supabase/ssr
```

Supabase provides:

* Authentication
* PostgreSQL database
* Session management
* Server/client database integration
* Row Level Security

## PostgreSQL

The persistent game state is stored in PostgreSQL.

The database contains:

* Tables
* Relationships
* Foreign keys
* Unique constraints
* Check constraints
* Triggers
* Row Level Security policies
* PostgreSQL functions
* Transactional game operations

## PL/pgSQL

PostgreSQL functions are used for important server-authoritative operations.

Important functions include:

```text
complete_quest_atomic
execute_investigation_action_atomic
solve_case_atomic
create_evidence_connection_atomic
purchase_equipment_atomic
toggle_equip_item_atomic
check_and_unlock_achievements
```

---

# 3D Graphics

## Three.js

**Version:** `0.160.0`

Three.js is used to create interactive 3D environments.

## React Three Fiber

**Version:** `8.16.8`

React Three Fiber integrates Three.js with React.

## React Three Drei

**Version:** `9.105.6`

Drei provides reusable helpers and components for React Three Fiber.

## Three.js Type Definitions

```text
@types/three
Version: 0.160.0
```

---

# Animation

## Framer Motion

**Version:** `11.2.10`

Used for:

* Page transitions
* Modal animations
* Card animations
* Cinematic effects
* Interactive UI
* Progress animations

---

# Icons

## Lucide React

**Version:** `0.395.0`

Used throughout the interface for:

* Navigation icons
* Buttons
* Actions
* Status indicators
* Gameplay controls

---

# Visual Effects

## Canvas Confetti

**Version:** `1.9.3`

Used for celebration effects such as:

* Quest completion
* Level-up moments
* Case completion
* Major rewards

---

# Styling Utilities

## clsx

**Version:** `2.1.1`

Used for conditional CSS class composition.

## tailwind-merge

**Version:** `2.3.0`

Used to merge Tailwind CSS utility classes without conflicting styles.

---

# Audio System

## Web Audio API

QuestChase contains a custom procedural audio system using the browser's native **Web Audio API**.

This avoids requiring external audio assets for the implemented sound effects.

The sound engine provides effects such as:

* Typewriter clicks
* Button clicks
* Evidence discovery sounds
* Red-thread connection sounds
* Paper rustling
* Detective stamp effects
* Level-up fanfare
* Case-solved fanfare

Implementation:

```text
src/lib/soundEngine.ts
```

---

# Development Tooling

## Node.js / npm

QuestChase is an npm-based Next.js application.

## ESLint

Versions:

```text
eslint: 8.57.1
eslint-config-next: 14.2.23
```

Used for code quality and linting.

## Vercel

The production application is deployed using Vercel.

Live application:

https://quest-chase.vercel.app/

---

# Backend API

QuestChase uses Next.js Route Handlers under:

```text
src/app/api/
```

## Tasks

```text
GET    /api/tasks
POST   /api/tasks

PATCH  /api/tasks/[id]
DELETE /api/tasks/[id]

POST   /api/tasks/[id]/complete
```

## Character

```text
GET /api/character
```

## Inventory

```text
GET /api/inventory
```

## Cases

```text
GET /api/cases
```

## Investigation

```text
POST /api/cases/[caseId]/actions
POST /api/cases/[caseId]/connections
POST /api/cases/[caseId]/deduction
PATCH /api/cases/[caseId]/board-positions
```

## Achievements

```text
GET /api/achievements
```

---

# Database and Security

Database migrations are located inside:

```text
supabase/migrations/
```

Current migrations:

```text
001_initial_schema.sql
002_security_and_game_integrity.sql
003_drop_old_investigation_rpc_and_enforce_chapter_integrity.sql
004_fix_quest_completion_and_security.sql
```

## Main Database Entities

The application stores persistent data for:

```text
profiles
tasks
case_progress
discovered_evidence
evidence_connections
executed_actions
user_inventory
user_achievements
reward_transactions
```

---

# Row Level Security

Supabase Row Level Security protects user-specific records.

Policies are based on:

```sql
auth.uid()
```

This ensures users cannot legitimately access another user's private game state.

---

# Server-Authoritative Rewards

QuestChase does not rely exclusively on client-side values for important rewards.

For example, quest rewards are calculated from the stored difficulty.

```text
Difficulty    XP       Gold
--------------------------------
S             240      70
A             180      50
B             120      35
C              80      20
D              60      15
E              40      10
```

The client cannot simply decide:

```text
"Give me 100000 Gold"
```

and expect the database to accept it.

The server/database determines the valid reward.

---

# Game Systems

## XP and Leveling

QuestChase uses a progressive leveling model.

The XP requirement is approximately:

```text
XP required ≈ round(100 × level^1.35)
```

This makes higher levels increasingly difficult to reach.

---

# Difficulty Rewards

| Difficulty |  XP | Gold | Base Attribute Gain |
| ---------- | --: | ---: | ------------------: |
| S          | 240 |   70 |                  35 |
| A          | 180 |   50 |                  25 |
| B          | 120 |   35 |                  18 |
| C          |  80 |   20 |                  15 |
| D          |  60 |   15 |                  12 |
| E          |  40 |   10 |                   8 |

---

# Category → Attribute Mapping

```text
Coding
   ↓
Intelligence

Reading
   ↓
Perception

Fitness / Study
   ↓
Discipline

Other categories
   ↓
Resilience
```

---

# Streak System

The server calculates daily activity streaks.

```text
First activity
      ↓
Streak starts

Previous day active
      ↓
Streak + 1

Same day activity
      ↓
Streak maintained

Missed day
      ↓
Streak resets to 1
```

---

# Gold Economy

Gold is the main investigation currency.

Gold can be used for:

* Forensic actions
* Investigation actions
* Detective equipment
* Gameplay upgrades

Important transactions are validated server-side.

---

# Case Investigation

## Case #001 — The Blackwood Murder

The primary investigation currently available is:

**The Blackwood Murder**

### Victim

Lord Arthur Blackwood

### Suspects

* Marcus Vance
* Dr. Elena Sterling
* Victor Ward
* Clara Giles

### Investigation Components

The case contains:

* Multiple chapters
* Crime-scene actions
* Evidence discovery
* Suspect information
* Timeline reconstruction
* Contradictions
* Evidence-board connections
* Final deduction

---

# Final Deduction

The final accusation consists of four components:

```text
WHO
WHEN
HOW
WHY
```

The server verifies:

1. The submitted identifiers.
2. The canonical case solution.
3. The required evidence.
4. The user's investigation progress.
5. Whether the case has already been solved.

This prevents the client from simply submitting arbitrary text and receiving the reward.

---

# Case Reward

The base case reward is:

```text
500 XP
250 Gold
Blackwood Case Master Seal
```

Equipment perks may modify applicable rewards according to the server-side rules.

---

# Application Routes

## Public Routes

```text
/
 /login
 /register
```

## Authenticated Routes

```text
/tasks
/headquarters
/desk
/character
/cases
/locker
/achievements
/investigate/[caseId]
/board/[caseId]
```

---

# Project File Structure

```text
QuestChase/
│
├── public/
│   ├── favicon.ico
│   ├── icon.png
│   ├── logo.png
│   └── logo.jpg
│
├── scripts/
│   ├── clean-next.js
│   ├── verify_final_security_and_chapters.js
│   └── verify_mystery_integrity.js
│
├── src/
│   │
│   ├── app/
│   │   │
│   │   ├── api/
│   │   │   ├── achievements/
│   │   │   ├── character/
│   │   │   ├── cases/
│   │   │   │   └── [caseId]/
│   │   │   │       ├── actions/
│   │   │   │       ├── board-positions/
│   │   │   │       ├── connections/
│   │   │   │       └── deduction/
│   │   │   │
│   │   │   ├── inventory/
│   │   │   └── tasks/
│   │   │       └── [id]/
│   │   │           └── complete/
│   │   │
│   │   ├── achievements/
│   │   ├── board/
│   │   │   └── [caseId]/
│   │   ├── cases/
│   │   ├── character/
│   │   ├── desk/
│   │   ├── headquarters/
│   │   ├── investigate/
│   │   │   └── [caseId]/
│   │   ├── locker/
│   │   ├── login/
│   │   ├── register/
│   │   ├── tasks/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   │
│   │   ├── 3d/
│   │   │   ├── CrimeScene3D.tsx
│   │   │   ├── HeadquartersOffice3D.tsx
│   │   │   └── RainParticles.tsx
│   │   │
│   │   ├── evidence/
│   │   │   └── FinalAccusationModal.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── CommandBar.tsx
│   │   │   ├── DetectiveHUD.tsx
│   │   │   ├── GameShell.tsx
│   │   │   └── LevelUpCinematic.tsx
│   │   │
│   │   ├── tasks/
│   │   │   ├── CreateTaskModal.tsx
│   │   │   ├── EditTaskModal.tsx
│   │   │   └── TaskCard.tsx
│   │   │
│   │   └── ui/
│   │       ├── AnimatedButton.tsx
│   │       ├── AnimatedNumber.tsx
│   │       ├── AnimatedProgressBar.tsx
│   │       ├── CaseSolvedCinematic.tsx
│   │       ├── Skeleton.tsx
│   │       └── ToastContainer.tsx
│   │
│   ├── lib/
│   │   ├── apiClient.ts
│   │   ├── initialData.ts
│   │   ├── serverAuth.ts
│   │   ├── serverCaseData.ts
│   │   ├── serverCaseSolutions.ts
│   │   ├── soundEngine.ts
│   │   ├── store.ts
│   │   ├── supabase.ts
│   │   └── types.ts
│   │
│   └── middleware.ts
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_security_and_game_integrity.sql
│       ├── 003_drop_old_investigation_rpc_and_enforce_chapter_integrity.sql
│       └── 004_fix_quest_completion_and_security.sql
│
├── .env.example
├── .eslintrc.json
├── .gitignore
├── next.config.mjs
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

# Environment Variables

Create a local environment file:

```text
.env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Do **not** commit `.env.local` or real Supabase credentials to GitHub.

---

# Local Development

## Prerequisites

Install:

* Node.js 18+
* Node.js 20+ recommended
* npm
* A Supabase project
* Git
* VS Code or another code editor

---

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd QuestChase
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Supabase

Create a Supabase project.

Get:

```text
Project URL
Anon/Public Key
```

---

## 4. Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

---

## 5. Apply Database Migrations

Run the SQL files in Supabase SQL Editor in this order:

```text
001_initial_schema.sql
002_security_and_game_integrity.sql
003_drop_old_investigation_rpc_and_enforce_chapter_integrity.sql
004_fix_quest_completion_and_security.sql
```

---

## 6. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Database Setup

The database should be initialized using the migrations under:

```text
supabase/migrations/
```

Migration order is important because later migrations modify the schema and security behavior introduced by earlier migrations.

Recommended order:

```text
001 → 002 → 003 → 004
```

---

# Build and Deployment

## Production Build

```bash
npm run build
```

## Start Production Server

```bash
npm start
```

## Run Linter

```bash
npm run lint
```

---

# Vercel Deployment

QuestChase is designed for deployment on Vercel.

Configure the following environment variables in the Vercel project:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Then deploy the project.

Production URL:

https://quest-chase.vercel.app/

---

# Available Scripts

## Development

```bash
npm run dev
```

Starts the development server.

## Production Build

```bash
npm run build
```

Creates the production Next.js build.

## Production Server

```bash
npm start
```

Starts the production server.

## Lint

```bash
npm run lint
```

Runs ESLint.

---

# Security and Integrity

QuestChase is designed so important game outcomes are not controlled exclusively by browser-side JavaScript.

## Authentication

Supabase Auth manages authenticated user sessions.

## Authorization

API routes verify the authenticated user before accessing user-specific game state.

## Row Level Security

PostgreSQL RLS policies restrict database access based on the authenticated user.

## Atomic Operations

Important game operations use database functions to perform multiple state changes atomically.

Examples:

```text
Quest completion
Investigation action
Evidence connection
Equipment purchase
Case solving
Achievement unlocking
```

## Duplicate Reward Protection

Quest completion and case completion contain protections against repeatedly claiming the same reward.

## Evidence Ownership

Users cannot legitimately connect evidence that they have not discovered.

## Server-Side Deduction Validation

The canonical mystery solution is kept server-side.

The final deduction is validated using structured identifiers rather than relying on loose client-side text matching.

## Chapter Gating

Investigation content is protected by chapter progression checks.

## Reward Ledger

Important XP and Gold changes are recorded through reward transactions.

---

# Client State vs Persistent State

Zustand is used as the client-side state layer.

It does not replace the database.

The general flow is:

```text
Supabase PostgreSQL
        ↓
Next.js API
        ↓
Zustand
        ↓
React UI
```

The database remains the authoritative source for persistent gameplay state.

---

# Important Source Files

## `src/lib/types.ts`

Contains TypeScript models for:

* Tasks
* Evidence
* Evidence connections
* Investigation actions
* Suspects
* Cases
* Equipment
* Achievements
* Detective profiles
* Notifications

## `src/lib/store.ts`

Contains the main client-side Zustand state.

## `src/lib/apiClient.ts`

Handles communication between the frontend and backend APIs.

## `src/lib/supabase.ts`

Contains Supabase client configuration.

## `src/lib/serverAuth.ts`

Provides server-side authentication helpers.

## `src/lib/serverCaseData.ts`

Contains server-side case-related data.

## `src/lib/serverCaseSolutions.ts`

Contains canonical case solution data and is intended to remain server-only.

## `src/lib/soundEngine.ts`

Contains the custom Web Audio API sound system.

## `src/lib/initialData.ts`

Contains client-safe initial game configuration and progression data.

---

# Future Scope

QuestChase can be expanded with:

* Multiple detective cases
* Daily and weekly challenges
* Multiplayer investigations
* Leaderboards
* Guild/team systems
* More 3D crime scenes
* Procedurally generated mysteries
* AI-assisted quest generation
* AI-generated case narratives
* Mobile/PWA support
* Push notifications
* Advanced evidence graph visualization
* More detective equipment
* Admin case-authoring tools
* Analytics dashboard
* Social features
* Cloud-hosted ambience and music
* Dynamic difficulty
* Seasonal cases

---

# Project Highlights

QuestChase demonstrates the combination of several modern software engineering concepts:

```text
Full-Stack Development
        +
Authentication
        +
Database Design
        +
REST APIs
        +
State Management
        +
3D Web Development
        +
Game Mechanics
        +
Security
        +
Animations
        +
Audio Engineering
        +
Responsive UI
        +
Cloud Deployment
```

The project is therefore more than a traditional productivity application. It combines **productivity software, RPG mechanics, detective gameplay, 3D visualization and server-authoritative game logic** into a single full-stack web application.

---

# Conclusion

QuestChase turns everyday productivity into an interactive detective adventure.

Instead of simply asking:

> "What tasks do I need to finish?"

QuestChase asks:

> **"What quest will you complete today?"**

Complete your quests.
Earn XP.
Build your detective.
Discover the evidence.
Connect the clues.
Solve the case.

---

## QuestChase

**Complete your quests. Follow the clues. Solve the case.**
