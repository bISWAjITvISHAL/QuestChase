import { create } from 'zustand';
import {
  DetectiveProfile,
  Task,
  CaseFile,
  EquipmentItem,
  Achievement,
  AttributeType,
  DetectiveRank,
} from './types';
import {
  INITIAL_PROFILE,
  INITIAL_TASKS,
  INITIAL_CASES,
  INITIAL_EQUIPMENT,
  INITIAL_ACHIEVEMENTS,
} from './initialData';
import { supabase, isSupabaseConfigured } from './supabase';
import { soundEngine } from './soundEngine';
import { apiFetch } from './apiClient';

interface GameState {
  profile: DetectiveProfile;
  tasks: Task[];
  cases: CaseFile[];
  activeCaseId: string;
  equipment: EquipmentItem[];
  achievements: Achievement[];
  levelUpModalOpen: boolean;
  levelUpData: {
    oldLevel: number;
    oldRank: DetectiveRank;
    newLevel: number;
    newRank: DetectiveRank;
    bonusGold: number;
    unlockedTitle: string;
  } | null;
  activeStampTaskId: string | null;
  isAuthenticated: boolean;
  userId: string | null;
  isLoading: boolean;
  errorMessage: string | null;

  // Actions
  initGame: () => Promise<void>;
  setAuthenticatedUser: (user: { id: string; email?: string; name?: string } | null) => void;
  setProfile: (profile: Partial<DetectiveProfile>) => void;
  clearError: () => void;

  // Quest / Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<{ success: boolean; message?: string }>;

  // Case & Investigation Actions
  setActiveCase: (caseId: string) => void;
  executeInvestigationAction: (caseId: string, actionId: string) => Promise<{ success: boolean; message: string }>;
  updateEvidenceBoardPosition: (caseId: string, evidenceId: string, x: number, y: number) => void;
  connectEvidence: (caseId: string, fromId: string, toId: string) => Promise<{ success: boolean; isDeduction: boolean; message: string }>;
  removeEvidenceConnection: (caseId: string, connectionId: string) => Promise<void>;
  submitFinalAccusation: (
    caseId: string,
    whoId: string,
    whenId: string,
    howId: string,
    whyId: string,
    selectedEvidenceIds?: string[]
  ) => Promise<{ isCorrect: boolean; feedback: string }>;

  // Equipment Actions
  purchaseEquipment: (itemId: string) => boolean;
  toggleEquipItem: (itemId: string) => void;

  // Achievements
  checkAchievements: () => void;

  // Modal / Cinematic Actions
  closeLevelUpModal: () => void;
}

// Debounce timer registry for board position sync
const boardPositionDebounceMap: Record<string, ReturnType<typeof setTimeout>> = {};

export const useGameStore = create<GameState>((set, get) => ({
  profile: INITIAL_PROFILE,
  tasks: INITIAL_TASKS,
  cases: INITIAL_CASES,
  activeCaseId: 'case_001',
  equipment: INITIAL_EQUIPMENT,
  achievements: INITIAL_ACHIEVEMENTS,
  levelUpModalOpen: false,
  levelUpData: null,
  activeStampTaskId: null,
  isAuthenticated: false,
  userId: null,
  isLoading: false,
  errorMessage: null,

  clearError: () => set({ errorMessage: null }),

  initGame: async () => {
    if (typeof window === 'undefined') return;

    set({ isLoading: true, errorMessage: null });

    try {
      if (isSupabaseConfigured && supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (user) {
          set({ isAuthenticated: true, userId: user.id });

          // Fetch authoritative profile, tasks, and cases from backend API
          const [profileRes, tasksRes, casesRes] = await Promise.allSettled([
            apiFetch('/api/character'),
            apiFetch('/api/tasks'),
            apiFetch('/api/cases'),
          ]);

          if (profileRes.status === 'fulfilled' && profileRes.value.profile) {
            set({ profile: profileRes.value.profile });
          }

          if (tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value.tasks)) {
            set({ tasks: tasksRes.value.tasks });
          }

          if (casesRes.status === 'fulfilled' && Array.isArray(casesRes.value.cases)) {
            set({ cases: casesRes.value.cases });
          }
        } else {
          set({ isAuthenticated: false, userId: null });
        }
      }
    } catch (err: unknown) {
      console.warn('Backend initialization note:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  setAuthenticatedUser: (user) => {
    if (!user) {
      set({ isAuthenticated: false, userId: null });
      return;
    }
    set((state) => ({
      isAuthenticated: true,
      userId: user.id,
      profile: {
        ...state.profile,
        id: user.id,
        email: user.email || state.profile.email,
        name: user.name || state.profile.name,
      },
    }));
  },

  setProfile: (updates) => {
    set((state) => ({
      profile: { ...state.profile, ...updates },
    }));

    // Sync to backend if authenticated
    apiFetch('/api/character', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }).catch((err) => {
      console.error('Failed to sync profile update:', err);
    });
  },

  addTask: async (taskInput) => {
    try {
      const response = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskInput),
      });

      if (response.success && response.task) {
        set((state) => ({
          tasks: [response.task, ...state.tasks],
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create quest';
      set({ errorMessage: msg });
      throw err;
    }
  },

  updateTask: async (id, updates) => {
    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (err: unknown) {
      // Rollback on failure
      set({ tasks: previousTasks });
      const msg = err instanceof Error ? err.message : 'Failed to update quest';
      set({ errorMessage: msg });
    }
  },

  deleteTask: async (id) => {
    // Optimistic delete
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    } catch (err: unknown) {
      // Rollback
      set({ tasks: previousTasks });
      const msg = err instanceof Error ? err.message : 'Failed to delete quest';
      set({ errorMessage: msg });
    }
  },

  completeTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task || task.isCompleted) {
      return { success: false, message: 'Quest already completed' };
    }

    // Play tactile stamp sound & visual animation
    soundEngine.playStampThud();
    set({ activeStampTaskId: id });
    setTimeout(() => {
      set({ activeStampTaskId: null });
    }, 1200);

    // Optimistic mark completed in memory
    const previousTasks = get().tasks;
    const previousProfile = get().profile;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t
      ),
    }));

    try {
      const response = await apiFetch(`/api/tasks/${id}/complete`, {
        method: 'POST',
      });

      if (response.success && response.profile) {
        // Authoritative update from server
        set((state) => ({
          profile: response.profile,
          tasks: state.tasks.map((t) => (t.id === id ? response.task : t)),
        }));

        if (response.levelUp?.didLevelUp) {
          soundEngine.playLevelUp();
          set({
            levelUpModalOpen: true,
            levelUpData: {
              oldLevel: response.levelUp.oldLevel || previousProfile.level,
              oldRank: previousProfile.rank,
              newLevel: response.levelUp.newLevel,
              newRank: response.levelUp.rank,
              bonusGold: response.levelUp.bonusGold || 50,
              unlockedTitle: `CLEARANCE GRADE ${response.levelUp.newLevel} • ${response.levelUp.rank}`,
            },
          });
        }

        get().checkAchievements();
        return { success: true };
      }

      return { success: true };
    } catch (err: unknown) {
      // Rollback on server error
      set({ tasks: previousTasks, profile: previousProfile });
      const msg = err instanceof Error ? err.message : 'Failed to complete quest';
      set({ errorMessage: msg });
      return { success: false, message: msg };
    }
  },

  setActiveCase: (caseId) => {
    set({ activeCaseId: caseId });
  },

  executeInvestigationAction: async (caseId, actionId) => {
    const currentCase = get().cases.find((c) => c.id === caseId);
    if (!currentCase) return { success: false, message: 'Case file not found' };

    const action = currentCase.actions.find((a) => a.id === actionId);
    if (!action) return { success: false, message: 'Action not found' };
    if (action.isExecuted) return { success: false, message: 'Action already conducted' };

    try {
      const response = await apiFetch(`/api/cases/${caseId}/actions`, {
        method: 'POST',
        body: JSON.stringify({ actionId }),
      });

      if (response.success) {
        soundEngine.playClueFound();

        // Update in-memory state with authoritative server results
        set((state) => {
          const updatedCases = state.cases.map((c) => {
            if (c.id !== caseId) return c;

            const updatedActions = c.actions.map((a) =>
              a.id === actionId ? { ...a, isExecuted: true } : a
            );

            const updatedEvidence = c.evidence.map((ev) =>
              ev.id === action.yieldsEvidenceId
                ? { ...ev, isDiscovered: true, discoveredAt: new Date().toISOString(), pinnedOnBoard: true }
                : ev
            );

            return {
              ...c,
              actions: updatedActions,
              evidence: updatedEvidence,
            };
          });

          const updatedProfile = {
            ...state.profile,
            gold: response.gold ?? state.profile.gold,
            evidenceDiscoveredCount: state.profile.evidenceDiscoveredCount + 1,
          };

          return { cases: updatedCases, profile: updatedProfile };
        });

        get().checkAchievements();
        return { success: true, message: response.message };
      }

      return { success: false, message: response.error || 'Investigation failed' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Investigation action failed';
      set({ errorMessage: msg });
      return { success: false, message: msg };
    }
  },

  updateEvidenceBoardPosition: (caseId, evidenceId, x, y) => {
    // 1. Immediate in-memory state update for 60fps UI
    set((state) => {
      const updatedCases = state.cases.map((c) => {
        if (c.id !== caseId) return c;
        const updatedEvidence = c.evidence.map((ev) =>
          ev.id === evidenceId ? { ...ev, boardPosition: { x, y } } : ev
        );
        return { ...c, evidence: updatedEvidence };
      });
      return { cases: updatedCases };
    });

    // 2. Debounced sync to database (400ms)
    const debounceKey = `${caseId}_${evidenceId}`;
    if (boardPositionDebounceMap[debounceKey]) {
      clearTimeout(boardPositionDebounceMap[debounceKey]);
    }

    boardPositionDebounceMap[debounceKey] = setTimeout(() => {
      delete boardPositionDebounceMap[debounceKey];
      apiFetch(`/api/cases/${caseId}/board-positions`, {
        method: 'POST',
        body: JSON.stringify({ evidenceId, x, y }),
      }).catch((err) => {
        console.warn('Board position background sync note:', err);
      });
    }, 400);
  },

  connectEvidence: async (caseId, fromId, toId) => {
    const currentCase = get().cases.find((c) => c.id === caseId);
    if (!currentCase) return { success: false, isDeduction: false, message: 'Case not found' };

    try {
      const response = await apiFetch(`/api/cases/${caseId}/connections`, {
        method: 'POST',
        body: JSON.stringify({ fromEvidenceId: fromId, toEvidenceId: toId }),
      });

      if (response.success && response.connection) {
        soundEngine.playThreadConnected();

        set((state) => {
          const updatedCases = state.cases.map((c) => {
            if (c.id !== caseId) return c;
            return {
              ...c,
              connections: [...c.connections, response.connection],
            };
          });
          return { cases: updatedCases };
        });

        return {
          success: true,
          isDeduction: response.isDeduction,
          message: response.message,
        };
      }

      return { success: false, isDeduction: false, message: response.error || 'Failed to connect evidence' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      return { success: false, isDeduction: false, message: msg };
    }
  },

  removeEvidenceConnection: async (caseId, connectionId) => {
    set((state) => {
      const updatedCases = state.cases.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          connections: c.connections.filter((cn) => cn.id !== connectionId),
        };
      });
      return { cases: updatedCases };
    });

    try {
      await apiFetch(`/api/cases/${caseId}/connections?connectionId=${connectionId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to remove connection from server:', err);
    }
  },

  submitFinalAccusation: async (caseId, whoId, whenId, howId, whyId, selectedEvidenceIds) => {
    try {
      const response = await apiFetch(`/api/cases/${caseId}/deduction`, {
        method: 'POST',
        body: JSON.stringify({ whoId, whenId, howId, whyId, selectedEvidenceIds }),
      });

      if (response.isCorrect) {
        soundEngine.playCaseSolved();

        set((state) => {
          const updatedCases = state.cases.map((c) =>
            c.id === caseId
              ? {
                  ...c,
                  status: 'SOLVED' as const,
                }
              : c
          );

          // Authoritative server profile update - NO manual client math
          const updatedProfile = response.profile
            ? {
                ...state.profile,
                ...response.profile,
                gold: response.profile.gold ?? state.profile.gold,
                xp: response.profile.xp ?? state.profile.xp,
                level: response.profile.level ?? state.profile.level,
                casesSolvedCount:
                  response.profile.cases_solved_count ??
                  response.profile.casesSolvedCount ??
                  (state.profile.casesSolvedCount + 1),
              }
            : state.profile;

          return { cases: updatedCases, profile: updatedProfile };
        });

        get().checkAchievements();
      }

      return {
        isCorrect: Boolean(response.isCorrect),
        feedback: response.feedback || (response.isCorrect ? 'Case solved!' : 'Deduction rejected'),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit deduction';
      return { isCorrect: false, feedback: msg };
    }
  },

  purchaseEquipment: (itemId) => {
    const { profile, equipment } = get();
    const item = equipment.find((e) => e.id === itemId);
    if (!item || item.isUnlocked) return false;

    if (profile.gold < item.costGold) return false;

    soundEngine.playClueFound();
    set((state) => ({
      profile: {
        ...state.profile,
        gold: state.profile.gold - item.costGold,
        equippedItems: [...state.profile.equippedItems, itemId],
      },
      equipment: state.equipment.map((e) =>
        e.id === itemId ? { ...e, isUnlocked: true, isEquipped: true } : e
      ),
    }));

    return true;
  },

  toggleEquipItem: (itemId) => {
    set((state) => {
      const item = state.equipment.find((e) => e.id === itemId);
      if (!item || !item.isUnlocked) return state;

      const willEquip = !item.isEquipped;
      const updatedEquipped = willEquip
        ? [...state.profile.equippedItems, itemId]
        : state.profile.equippedItems.filter((id) => id !== itemId);

      return {
        profile: { ...state.profile, equippedItems: updatedEquipped },
        equipment: state.equipment.map((e) =>
          e.id === itemId ? { ...e, isEquipped: willEquip } : e
        ),
      };
    });
  },

  checkAchievements: () => {
    const { profile, tasks, cases, achievements } = get();
    const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
    const discoveredCluesCount = cases.reduce(
      (acc, c) => acc + c.evidence.filter((e) => e.isDiscovered).length,
      0
    );
    const solvedCasesCount = cases.filter((c) => c.status === 'SOLVED').length;

    let newlyUnlocked = false;

    const updated = achievements.map((ach) => {
      if (ach.isUnlocked) return ach;

      let progress = 0;
      let shouldUnlock = false;

      if (ach.id === 'ach_first_blood') {
        progress = completedTasksCount >= 1 ? 1 : 0;
        shouldUnlock = progress >= 1;
      } else if (ach.id === 'ach_streak_3') {
        progress = profile.streak;
        shouldUnlock = progress >= 3;
      } else if (ach.id === 'ach_clue_finder') {
        progress = discoveredCluesCount;
        shouldUnlock = progress >= 5;
      } else if (ach.id === 'ach_first_case') {
        progress = solvedCasesCount;
        shouldUnlock = progress >= 1;
      }

      if (shouldUnlock && !ach.isUnlocked) {
        newlyUnlocked = true;
        return {
          ...ach,
          progress: ach.maxProgress,
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
        };
      }

      return { ...ach, progress };
    });

    if (newlyUnlocked) {
      soundEngine.playLevelUp();
      set({ achievements: updated });
    }
  },

  closeLevelUpModal: () => {
    set({ levelUpModalOpen: false, levelUpData: null });
  },
}));
