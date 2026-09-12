export type AttributeType = 'intelligence' | 'perception' | 'discipline' | 'resilience';

export interface AttributeStats {
  intelligence: number;
  perception: number;
  discipline: number;
  resilience: number;
  [key: string]: number | undefined;
}

export type DetectiveRank =
  | 'ROOKIE'
  | 'DETECTIVE'
  | 'INVESTIGATOR'
  | 'INSPECTOR'
  | 'SPECIALIST'
  | 'SENIOR INVESTIGATOR'
  | 'CHIEF INVESTIGATOR'
  | 'MASTER DETECTIVE';

export interface RankInfo {
  rank: DetectiveRank;
  minLevel: number;
  title: string;
  badgeUrl?: string;
  description: string;
}

export type TaskDifficulty = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type TaskCategory =
  | 'Intelligence'
  | 'Perception'
  | 'Discipline'
  | 'Resilience'
  | 'Coding'
  | 'Study'
  | 'Fitness'
  | 'Reading'
  | 'Work'
  | 'Health'
  | 'Creative'
  | 'Personal';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  category: TaskCategory;
  difficulty?: TaskDifficulty;
  priority: TaskPriority;
  xpReward: number;
  goldReward: number;
  attributeRewards: Partial<Record<AttributeType, number>>;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  dueDate?: string;
}

export type EvidenceType =
  | 'PHYSICAL EVIDENCE'
  | 'TESTIMONY'
  | 'DOCUMENTS'
  | 'DIGITAL EVIDENCE'
  | 'TIMELINE INFORMATION'
  | 'CONTRADICTIONS';

export interface EvidenceItem {
  id: string;
  caseId: string;
  chapterId: string;
  isDiscovered: boolean;
  title?: string;
  type?: EvidenceType;
  description?: string;
  detailedNotes?: string;
  source?: string;
  reliability?: 'LOW' | 'MEDIUM' | 'HIGH' | 'ABSOLUTE';
  connectedSuspects?: string[];
  discoveredAt?: string;
  pinnedOnBoard?: boolean;
  boardPosition?: { x: number; y: number };
  contradictionPairId?: string;
  isFalseLead?: boolean;
  timelineTimestamp?: string;
  tag?: string;
}

export interface EvidenceConnection {
  id: string;
  caseId: string;
  fromEvidenceId: string;
  toEvidenceId: string;
  reason?: string;
  isDeductionValid?: boolean;
  unlockedDeductionTitle?: string;
  discoveredAt: string;
}

export interface InvestigationAction {
  id: string;
  caseId: string;
  sceneObjectId: string;
  sceneObjectName: string;
  title: string;
  description: string;
  costGold: number;
  minRank?: DetectiveRank;
  reqAttributes?: Partial<Record<AttributeType, number>>;
  alternateRoute?: {
    reqAttributes: Partial<Record<AttributeType, number>>;
    label: string;
  };
  potentialEvidenceLabel?: string;
  yieldsEvidenceId: string;
  findingsReport?: string;
  isExecuted: boolean;
  locationLabel: string;
}

export interface Suspect {
  id: string;
  name: string;
  role: string;
  alibi: string;
  motiveSummary: string;
  avatarUrl: string;
  statusNotes: string;
}

export interface CaseChapter {
  id: string;
  caseId: string;
  chapterNumber: number;
  title: string;
  objective: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  requiredEvidenceCount: number;
}

export interface CaseFile {
  id: string;
  code: string; // e.g. "CASE #001"
  title: string;
  subtitle: string;
  synopsis: string;
  location: string;
  status: 'UNSOLVED' | 'IN_PROGRESS' | 'SOLVED';
  currentChapterId: string;
  chapters: CaseChapter[];
  suspects: Suspect[];
  evidence: EvidenceItem[];
  actions: InvestigationAction[];
  connections: EvidenceConnection[];
  rewardXp: number;
  rewardGold: number;
  rewardBadge: string;
  reqRank: DetectiveRank;
  crimeSceneBgUrl?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'OPTICS' | 'DOCUMENTATION' | 'APPAREL' | 'TIMEKEEPING' | 'UTILITY' | 'COLLECTIBLE';
  description: string;
  costGold: number;
  isUnlocked: boolean;
  isEquipped: boolean;
  iconName: string;
  perkDescription: string;
  attributeBonuses: Partial<Record<AttributeType, number>>;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'INVESTIGATION' | 'PRODUCTIVITY' | 'DEDUCTION' | 'MASTERY';
  icon: string;
  rewardXp: number;
  rewardGold: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface DetectiveProfile {
  id: string;
  name: string;
  badgeId: string;
  email: string;
  rank: DetectiveRank;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
  streak: number;
  lastActiveDate: string;
  attributes: AttributeStats;
  tasksCompletedCount: number;
  casesSolvedCount: number;
  evidenceDiscoveredCount: number;
  equippedItems: string[];
  settings: {
    audioEnabled: boolean;
    ambienceEnabled: boolean;
    reducedMotion: boolean;
  };
}

export type ToastType = 'success' | 'error' | 'info' | 'reward';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  xpReward?: number;
  goldReward?: number;
  duration?: number;
}
