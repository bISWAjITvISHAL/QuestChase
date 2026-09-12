import { create } from 'zustand';
import {
  DetectiveProfile,
  Task,
  CaseFile,
  EvidenceItem,
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
  isInitialized: boolean;
  errorMessage: string | null;
  lastPersistedPositions: Record<string, { x: number; y: number }>;

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
  executeInvestigationAction: (caseId: string, actionId: string) => Promise<{ success: boolean; message: string; evidence?: EvidenceItem | null }>;
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
  purchaseEquipment: (itemId: string) => Promise<boolean>;
  toggleEquipItem: (itemId: string) => Promise<void>;

  // Achievements
  checkAchievements: () => Promise<void>;

  // Auth
  signOut: () => Promise<void>;

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
  lastPersistedPositions: {},
  levelUpModalOpen: false,
  levelUpData: null,
  activeStampTaskId: null,
  isAuthenticated: false,
  userId: null,
  isLoading: false,
  isInitialized: false,
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

          // Fetch authoritative profile, tasks, cases, inventory, and achievements from backend API
          const [profileRes, tasksRes, casesRes, invRes, achRes] = await Promise.allSettled([
            apiFetch('/api/character'),
            apiFetch('/api/tasks'),
            apiFetch('/api/cases'),
            apiFetch('/api/inventory'),
            apiFetch('/api/achievements'),
          ]);

          if (profileRes.status === 'fulfilled' && profileRes.value.profile) {
            set({ profile: profileRes.value.profile });
          }

          if (tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value.tasks)) {
            set({ tasks: tasksRes.value.tasks });
          }

          if (casesRes.status === 'fulfilled' && Array.isArray(casesRes.value.cases)) {
            const fetchedCases = casesRes.value.cases as CaseFile[];
            const posMap: Record<string, { x: number; y: number }> = {};
            fetchedCases.forEach((c) => {
              c.evidence.forEach((ev) => {
                if (ev.boardPosition) {
                  posMap[ev.id] = { ...ev.boardPosition };
                }
              });
            });
            set({ cases: fetchedCases, lastPersistedPositions: posMap });
          }

          if (invRes.status === 'fulfilled' && Array.isArray(invRes.value.items)) {
            const ownedItems = invRes.value.items as Array<{ item_id: string; is_equipped: boolean }>;
            const ownedMap = new Map<string, { item_id: string; is_equipped: boolean }>(
              ownedItems.map((it) => [it.item_id, it])
            );
            set((state) => ({
              equipment: state.equipment.map((eq) => {
                const owned = ownedMap.get(eq.id);
                if (owned) {
                  return { ...eq, isUnlocked: true, isEquipped: owned.is_equipped };
                }
                return eq;
              }),
            }));
          }

          if (achRes.status === 'fulfilled' && Array.isArray(achRes.value.achievements)) {
            const unlockedList = achRes.value.achievements as Array<{
              achievement_id: string;
              is_unlocked: boolean;
              progress: number;
              unlocked_at?: string;
            }>;
            const unlockedMap = new Map<
              string,
              { achievement_id: string; is_unlocked: boolean; progress: number; unlocked_at?: string }
            >(unlockedList.map((a) => [a.achievement_id, a]));
            set((state) => ({
              achievements: state.achievements.map((ach) => {
                const unl = unlockedMap.get(ach.id);
                if (unl && unl.is_unlocked) {
                  return { ...ach, isUnlocked: true, progress: ach.maxProgress, unlockedAt: unl.unlocked_at };
                }
                return ach;
              }),
            }));
          }

          // Phase 18: Detect critical synchronization failures and display error state
          const failedEndpoints: string[] = [];
          if (profileRes.status === 'rejected' || (profileRes.status === 'fulfilled' && profileRes.value?.error)) {
            failedEndpoints.push('Detective Profile');
          }
          if (casesRes.status === 'rejected' || (casesRes.status === 'fulfilled' && casesRes.value?.error)) {
            failedEndpoints.push('Case Files');
          }
          if (tasksRes.status === 'rejected' || (tasksRes.status === 'fulfilled' && tasksRes.value?.error)) {
            failedEndpoints.push('Assigned Quests');
          }

          if (failedEndpoints.length > 0) {
            set({
              errorMessage: `Bureau Connection Warning: Failed to synchronize ${failedEndpoints.join(', ')}. Please verify connection or retry.`,
            });
          }
        } else {
          set({ isAuthenticated: false, userId: null });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Backend connection failed';
      console.warn('Backend initialization error:', err);
      set({ errorMessage: `Authentication & Initialization Error: ${msg}` });
    } finally {
      set({ isLoading: false, isInitialized: true });
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

        const revealedEv = response.evidence;

        // Update in-memory state with authoritative server results
        set((state) => {
          const updatedCases = state.cases.map((c) => {
            if (c.id !== caseId) return c;

            const updatedActions = c.actions.map((a) =>
              a.id === actionId ? { ...a, isExecuted: true } : a
            );

            const updatedEvidence = c.evidence.map((ev) =>
              ev.id === action.yieldsEvidenceId
                ? {
                    ...ev,
                    ...(revealedEv || {}),
                    isDiscovered: true,
                    discoveredAt: new Date().toISOString(),
                    pinnedOnBoard: true,
                  }
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

          const updatedPositions = {
            ...state.lastPersistedPositions,
            ...(revealedEv?.boardPosition ? { [action.yieldsEvidenceId]: revealedEv.boardPosition } : {}),
          };

          return { cases: updatedCases, profile: updatedProfile, lastPersistedPositions: updatedPositions };
        });

        get().checkAchievements();
        return { success: true, message: response.message, evidence: revealedEv };
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

    // 2. Debounced sync to database (400ms) with rollback on error to lastPersistedPositions
    const debounceKey = `${caseId}_${evidenceId}`;
    if (boardPositionDebounceMap[debounceKey]) {
      clearTimeout(boardPositionDebounceMap[debounceKey]);
    }

    boardPositionDebounceMap[debounceKey] = setTimeout(() => {
      delete boardPositionDebounceMap[debounceKey];
      apiFetch(`/api/cases/${caseId}/board-positions`, {
        method: 'POST',
        body: JSON.stringify({ evidenceId, x, y }),
      })
        .then((res) => {
          if (res?.success) {
            set((state) => ({
              lastPersistedPositions: {
                ...state.lastPersistedPositions,
                [evidenceId]: { x, y },
              },
            }));
          }
        })
        .catch((err) => {
          console.warn('Board position background sync failed, rolling back to last persisted DB position:', err);
          const lastGood = get().lastPersistedPositions[evidenceId];
          if (lastGood) {
            set((state) => {
              const updatedCases = state.cases.map((c) => {
                if (c.id !== caseId) return c;
                const updatedEvidence = c.evidence.map((ev) =>
                  ev.id === evidenceId ? { ...ev, boardPosition: lastGood } : ev
                );
                return { ...c, evidence: updatedEvidence };
              });
              return { cases: updatedCases };
            });
          }
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

  purchaseEquipment: async (itemId) => {
    const { profile, equipment } = get();
    const item = equipment.find((e) => e.id === itemId);
    if (!item || item.isUnlocked) return false;

    if (profile.gold < item.costGold) return false;

    const prevEquipment = get().equipment;
    const prevProfile = get().profile;

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

    try {
      const response = await apiFetch('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({ action: 'purchase', itemId }),
      });

      if (response.success) {
        if (response.gold !== undefined) {
          set((state) => ({ profile: { ...state.profile, gold: response.gold } }));
        }
        return true;
      } else {
        set({ equipment: prevEquipment, profile: prevProfile });
        return false;
      }
    } catch {
      set({ equipment: prevEquipment, profile: prevProfile });
      return false;
    }
  },

  toggleEquipItem: async (itemId) => {
    const item = get().equipment.find((e) => e.id === itemId);
    if (!item || !item.isUnlocked) return;

    const prevEquipment = get().equipment;
    const prevProfile = get().profile;
    const willEquip = !item.isEquipped;
    const updatedEquipped = willEquip
      ? [...prevProfile.equippedItems, itemId]
      : prevProfile.equippedItems.filter((id) => id !== itemId);

    set((state) => ({
      profile: { ...state.profile, equippedItems: updatedEquipped },
      equipment: state.equipment.map((e) =>
        e.id === itemId ? { ...e, isEquipped: willEquip } : e
      ),
    }));

    try {
      const response = await apiFetch('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({ action: 'equip', itemId }),
      });
      if (!response.success) {
        set({ equipment: prevEquipment, profile: prevProfile });
      }
    } catch {
      set({ equipment: prevEquipment, profile: prevProfile });
    }
  },

  checkAchievements: async () => {
    try {
      const res = await apiFetch('/api/achievements', {
        method: 'POST',
      });

      if (res.success && Array.isArray(res.achievements)) {
        const unlockedList = res.achievements as Array<{
          achievement_id: string;
          is_unlocked: boolean;
          progress: number;
          unlocked_at?: string;
        }>;
        const unlockedMap = new Map<
          string,
          { achievement_id: string; is_unlocked: boolean; progress: number; unlocked_at?: string }
        >(unlockedList.map((a) => [a.achievement_id, a]));

        set((state) => ({
          achievements: state.achievements.map((ach) => {
            const unl = unlockedMap.get(ach.id);
            if (unl && unl.is_unlocked) {
              return { ...ach, isUnlocked: true, progress: ach.maxProgress, unlockedAt: unl.unlocked_at };
            }
            return ach;
          }),
        }));

        if (Array.isArray(res.newlyUnlocked) && res.newlyUnlocked.length > 0) {
          soundEngine.playLevelUp();
          // Refresh profile to reflect any XP/Gold bonuses gained from unlocked achievements
          const charRes = await apiFetch('/api/character');
          if (charRes.profile) {
            set({ profile: charRes.profile });
          }
        }
      }
    } catch (err) {
      console.warn('Authoritative achievement sync note:', err);
    }
  },

  signOut: async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out note:', err);
    } finally {
      set({
        isAuthenticated: false,
        userId: null,
        isInitialized: false,
        profile: INITIAL_PROFILE,
        tasks: [],
        cases: INITIAL_CASES,
        equipment: INITIAL_EQUIPMENT,
        achievements: INITIAL_ACHIEVEMENTS,
        lastPersistedPositions: {},
      });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  closeLevelUpModal: () => {
    set({ levelUpModalOpen: false, levelUpData: null });
  },
}));
