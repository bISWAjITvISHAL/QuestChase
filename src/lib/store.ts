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
  ToastNotification,
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
  toasts: ToastNotification[];
  achievementQueue: Achievement[];
  levelUpModalOpen: boolean;
  levelUpData: {
    oldLevel: number;
    oldRank: DetectiveRank;
    newLevel: number;
    newRank: DetectiveRank;
    bonusGold: number;
    unlockedTitle: string;
  } | null;
  caseSolvedModalOpen: boolean;
  solvedCaseData: {
    caseId: string;
    title: string;
    feedback: string;
    rewardXp: number;
    rewardGold: number;
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

  // Toast / Notifications
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  enqueueAchievement: (achievement: Achievement) => void;
  dequeueAchievement: () => void;

  // Quest / Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<{ success: boolean; message?: string }>;
  undoTaskCompletion: (
    id: string,
    rewards: { xp: number; gold: number; attributes?: Partial<Record<AttributeType, number>> }
  ) => void;

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
  ) => Promise<{ isCorrect: boolean; feedback: string; rewardXp?: number; rewardGold?: number; rewardBadge?: string }>;

  // Equipment Actions
  purchaseEquipment: (itemId: string) => Promise<boolean>;
  toggleEquipItem: (itemId: string) => Promise<void>;

  // Achievements
  checkAchievements: () => Promise<void>;

  // Auth
  signOut: () => Promise<void>;

  // Modal / Cinematic Actions
  closeLevelUpModal: () => void;
  openCaseSolvedModal: (data: { caseId: string; title: string; feedback: string; rewardXp: number; rewardGold: number }) => void;
  closeCaseSolvedModal: () => void;
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
  toasts: [],
  achievementQueue: [],
  lastPersistedPositions: {},
  levelUpModalOpen: false,
  levelUpData: null,
  caseSolvedModalOpen: false,
  solvedCaseData: null,
  activeStampTaskId: null,
  isAuthenticated: false,
  userId: null,
  isLoading: false,
  isInitialized: false,
  errorMessage: null,

  clearError: () => set({ errorMessage: null }),

  addToast: (toastInput) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastNotification = { ...toastInput, id };

    set((state) => ({
      toasts: [...state.toasts.slice(-4), newToast], // Keep max 5 active
    }));

    const duration = toastInput.duration || 4500;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  enqueueAchievement: (achievement) => {
    set((state) => ({
      achievementQueue: [...state.achievementQueue, achievement],
    }));
  },

  dequeueAchievement: () => {
    set((state) => ({
      achievementQueue: state.achievementQueue.slice(1),
    }));
  },

  openCaseSolvedModal: (data) => {
    set({ caseSolvedModalOpen: true, solvedCaseData: data });
  },

  closeCaseSolvedModal: () => {
    set({ caseSolvedModalOpen: false, solvedCaseData: null });
  },

  initGame: async () => {
    if (typeof window === 'undefined') return;

    // Synchronize initial audio settings from local storage if available for instant responsive UX
    try {
      const savedSettingsRaw = localStorage.getItem('casefile_audio_settings');
      if (savedSettingsRaw) {
        const parsed = JSON.parse(savedSettingsRaw);
        if (typeof parsed.audioEnabled === 'boolean') {
          soundEngine.setSoundEnabled(parsed.audioEnabled);
        }
        if (typeof parsed.ambienceEnabled === 'boolean') {
          soundEngine.setAmbienceEnabled(parsed.ambienceEnabled);
        }
        set((state) => ({
          profile: {
            ...state.profile,
            settings: {
              ...state.profile.settings,
              ...parsed,
            },
          },
        }));
      }
    } catch {
      // Ignored
    }

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
            const fetchedProfile = profileRes.value.profile as DetectiveProfile;
            const settings = {
              audioEnabled: fetchedProfile.settings?.audioEnabled ?? true,
              ambienceEnabled: fetchedProfile.settings?.ambienceEnabled ?? true,
              reducedMotion: fetchedProfile.settings?.reducedMotion ?? false,
            };
            fetchedProfile.settings = settings;
            set({ profile: fetchedProfile });

            // Synchronize sound engine immediately with authenticated user's persisted profile settings
            soundEngine.setSoundEnabled(settings.audioEnabled);
            soundEngine.setAmbienceEnabled(settings.ambienceEnabled);

            try {
              localStorage.setItem('casefile_audio_settings', JSON.stringify(settings));
            } catch {
              // Ignored
            }
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
    set((state) => {
      const mergedSettings = updates.settings
        ? { ...state.profile.settings, ...updates.settings }
        : state.profile.settings;

      if (updates.settings) {
        if (typeof updates.settings.audioEnabled === 'boolean') {
          soundEngine.setSoundEnabled(updates.settings.audioEnabled);
        }
        if (typeof updates.settings.ambienceEnabled === 'boolean') {
          soundEngine.setAmbienceEnabled(updates.settings.ambienceEnabled);
        }
        try {
          localStorage.setItem('casefile_audio_settings', JSON.stringify(mergedSettings));
        } catch {
          // Ignored
        }
      }

      return {
        profile: {
          ...state.profile,
          ...updates,
          ...(updates.settings ? { settings: mergedSettings } : {}),
        },
      };
    });

    // Sync to backend if authenticated
    if (get().isAuthenticated) {
      apiFetch('/api/character', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }).catch((err) => {
        console.error('Failed to sync profile update:', err);
      });
    }
  },

  addTask: async (taskInput) => {
    // 1. Create task optimistically with local ID for instant UI response & guest/offline support
    const localTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: taskInput.title,
      description: taskInput.description,
      category: taskInput.category,
      difficulty: taskInput.difficulty || 'B',
      priority: taskInput.priority || 'MEDIUM',
      xpReward: taskInput.xpReward,
      goldReward: taskInput.goldReward,
      attributeRewards: taskInput.attributeRewards || {},
      isCompleted: false,
      dueDate: taskInput.dueDate,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      tasks: [localTask, ...state.tasks],
    }));

    // 2. If authenticated, persist to backend API
    if (get().isAuthenticated) {
      try {
        const response = await apiFetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(taskInput),
        });

        if (response?.success && response?.task) {
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === localTask.id ? response.task : t)),
          }));
          get().addToast({
            type: 'success',
            title: 'QUEST DOCKET FILED',
            message: `${localTask.title} commissioned to detective desk.`,
          });
        } else {
          // Revert optimistic task on server failure
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== localTask.id),
          }));
          get().addToast({
            type: 'error',
            title: 'FILING FAILED',
            message: response?.error || 'Unable to file quest docket to server.',
          });
        }
      } catch (err: unknown) {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== localTask.id),
        }));
        get().addToast({
          type: 'error',
          title: 'FILING ERROR',
          message: 'Network error preventing docket creation.',
        });
      }
    } else {
      // Guest mode
      get().addToast({
        type: 'success',
        title: 'QUEST DOCKET FILED',
        message: `${localTask.title} commissioned to detective desk.`,
      });
    }
  },

  updateTask: async (id, updates) => {
    // 1. Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    get().addToast({
      type: 'success',
      title: 'DOCKET AMENDED',
      message: 'Casework details successfully updated.',
    });

    // 2. Sync with backend API if authenticated and non-local ID
    try {
      if (!id.startsWith('task_')) {
        const response = await apiFetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        if (response?.success && response?.task) {
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? response.task : t)),
          }));
        }
      }
    } catch (err: unknown) {
      console.warn('Backend quest update deferred (running in local/guest mode):', err);
    }
  },

  deleteTask: async (id) => {
    // Optimistic delete
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    get().addToast({
      type: 'success',
      title: 'DOCKET PURGED',
      message: 'Casework docket permanently removed from records.',
    });

    try {
      if (!id.startsWith('task_')) {
        await apiFetch(`/api/tasks/${id}`, {
          method: 'DELETE',
        });
      }
    } catch (err: unknown) {
      console.warn('Backend delete skipped (local/demo task):', err);
    }
  },

  undoTaskCompletion: (id, rewards) => {
    soundEngine.playPaperRustle();
    set((state) => {
      const updatedTasks = state.tasks.map((t) =>
        t.id === id ? { ...t, isCompleted: false, completedAt: undefined } : t
      );
      const newGold = Math.max(0, state.profile.gold - rewards.gold);
      const newXp = Math.max(0, state.profile.xp - rewards.xp);

      const newAttrs = { ...state.profile.attributes };
      if (rewards.attributes) {
        (Object.keys(rewards.attributes) as AttributeType[]).forEach((attr) => {
          const val = rewards.attributes?.[attr];
          if (val) {
            newAttrs[attr] = Math.max(0, (newAttrs[attr] || 0) - val);
          }
        });
      }

      return {
        tasks: updatedTasks,
        profile: {
          ...state.profile,
          gold: newGold,
          xp: newXp,
          attributes: newAttrs,
        },
      };
    });

    get().addToast({
      type: 'info',
      title: 'COMPLETION UNDONE',
      message: `Reclaimed ${rewards.gold} Gold & ${rewards.xp} XP. Task restored to active.`,
    });
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

    // Snapshot state before optimistic update
    const previousTasks = get().tasks;
    const previousProfile = get().profile;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t
      ),
    }));

    const isLocalGuestTask = id.startsWith('task_') || !get().isAuthenticated;

    try {
      const response = !isLocalGuestTask
        ? await apiFetch(`/api/tasks/${id}/complete`, { method: 'POST' })
        : null;

      if (!isLocalGuestTask) {
        if (response?.success && response.profile) {
          // Authoritative update from server
          set((state) => ({
            profile: response.profile,
            tasks: state.tasks.map((t) => (t.id === id ? response.task : t)),
          }));

          // Reward Toast notification
          get().addToast({
            type: 'reward',
            title: 'QUEST COMPLETED',
            message: `${task.title} • Your progress funds the investigation!`,
            xpReward: task.xpReward,
            goldReward: task.goldReward || 20,
          });

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
        } else {
          // Rollback on server failure
          set({ tasks: previousTasks, profile: previousProfile });
          const errorMsg = response?.error || 'Database sync failed. Quest completion could not be verified.';
          get().addToast({
            type: 'error',
            title: 'COMPLETION FAILED',
            message: errorMsg,
          });
          return { success: false, message: errorMsg };
        }
      } else {
        // Local/guest mode rewards
        const newXp = previousProfile.xp + task.xpReward;
        const newGold = previousProfile.gold + (task.goldReward || 20);
        const newLevel = Math.floor(newXp / 500) + 1;
        set((state) => ({
          profile: {
            ...state.profile,
            xp: newXp,
            gold: newGold,
            level: newLevel,
          },
        }));

        get().addToast({
          type: 'reward',
          title: 'QUEST COMPLETED',
          message: `${task.title} • Your progress funds the investigation!`,
          xpReward: task.xpReward,
          goldReward: task.goldReward || 20,
        });

        get().checkAchievements();
        return { success: true };
      }
    } catch (err: unknown) {
      if (!isLocalGuestTask) {
        // Rollback on server error
        set({ tasks: previousTasks, profile: previousProfile });
        const errMsg = err instanceof Error ? err.message : 'Database sync failed';
        get().addToast({
          type: 'error',
          title: 'COMPLETION FAILED',
          message: errMsg,
        });
        return { success: false, message: errMsg };
      } else {
        // Local/guest mode fallback
        const newXp = previousProfile.xp + task.xpReward;
        const newGold = previousProfile.gold + (task.goldReward || 20);
        const newLevel = Math.floor(newXp / 500) + 1;
        set((state) => ({
          profile: {
            ...state.profile,
            xp: newXp,
            gold: newGold,
            level: newLevel,
          },
        }));

        get().addToast({
          type: 'reward',
          title: 'QUEST COMPLETED',
          message: `${task.title} • Your progress funds the investigation!`,
          xpReward: task.xpReward,
          goldReward: task.goldReward || 20,
        });

        get().checkAchievements();
        return { success: true };
      }
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

        get().addToast({
          type: 'success',
          title: 'EVIDENCE DISCOVERED & LOGGED',
          message: revealedEv?.title || response.message,
        });

        get().checkAchievements();
        return { success: true, message: response.message, evidence: revealedEv };
      }

      const errMsg = response.error || 'Investigation failed';
      get().addToast({
        type: 'error',
        title: 'INVESTIGATION ACTION BLOCKED',
        message: errMsg,
      });
      return { success: false, message: errMsg };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Investigation action failed';
      set({ errorMessage: msg });
      get().addToast({
        type: 'error',
        title: 'INVESTIGATION FAILED',
        message: 'Unable to communicate with forensic field team. Progress safe.',
      });
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

      const currentCase = get().cases.find((c) => c.id === caseId);

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

        // Trigger the grand Case Solved celebration!
        get().openCaseSolvedModal({
          caseId,
          title: currentCase?.title || 'THE BLACKWOOD MURDER',
          feedback: response.feedback || 'Case solved! The perpetrator has been brought to justice.',
          rewardXp: currentCase?.rewardXp || 500,
          rewardGold: currentCase?.rewardGold || 250,
        });

        get().addToast({
          type: 'success',
          title: 'CASE SOLVED & CLOSED',
          message: 'Tribunal validated your deduction.',
          xpReward: currentCase?.rewardXp || 500,
          goldReward: currentCase?.rewardGold || 250,
        });

        get().checkAchievements();
      } else {
        get().addToast({
          type: 'error',
          title: 'DEDUCTION REJECTED',
          message: response.feedback || 'Insufficient corroborating proof to convict.',
        });
      }

      return {
        isCorrect: Boolean(response.isCorrect),
        feedback: response.feedback || (response.isCorrect ? 'Case solved!' : 'Deduction rejected'),
        rewardXp: response.rewardXp,
        rewardGold: response.rewardGold,
        rewardBadge: response.rewardBadge,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit deduction';
      get().addToast({
        type: 'error',
        title: 'TRIBUNAL CONNECTION FAILED',
        message: 'Unable to deliver final accusation to magistrates.',
      });
      return { isCorrect: false, feedback: msg };
    }
  },

  purchaseEquipment: async (itemId) => {
    const { profile, equipment } = get();
    const item = equipment.find((e) => e.id === itemId);
    if (!item || item.isUnlocked) return false;

    if (profile.gold < item.costGold) {
      get().addToast({
        type: 'error',
        title: 'INSUFFICIENT GOLD',
        message: `Requisitioning ${item.name} requires ${item.costGold} Gold. You have ${profile.gold}.`,
      });
      return false;
    }

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
        get().addToast({
          type: 'success',
          title: 'GEAR ACQUIRED & EQUIPPED',
          message: `${item.name} successfully requisitioned from Quartermaster.`,
        });
        return true;
      } else {
        set({ equipment: prevEquipment, profile: prevProfile });
        get().addToast({
          type: 'error',
          title: 'REQUISITION REJECTED',
          message: response.error || 'Quartermaster denied requisition.',
        });
        return false;
      }
    } catch {
      set({ equipment: prevEquipment, profile: prevProfile });
      get().addToast({
        type: 'error',
        title: 'REQUISITION FAILED',
        message: 'Failed to contact field armory.',
      });
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

    get().addToast({
      type: 'info',
      title: willEquip ? 'GEAR EQUIPPED' : 'GEAR UNEQUIPPED',
      message: `${item.name} ${willEquip ? 'is now active in field loadout.' : 'returned to locker.'}`,
    });

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

          // Enqueue achievements sequentially so they never stack on top of each other
          res.newlyUnlocked.forEach((unlId: string) => {
            const achObj = get().achievements.find((a) => a.id === unlId);
            if (achObj) {
              get().enqueueAchievement(achObj);
            }
          });

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
