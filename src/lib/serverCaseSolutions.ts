// ==========================================================
// QUESTCHASE SERVER-ONLY CANONICAL CASE SOLUTIONS & SECRETS
// THIS FILE IS STRICTLY EXCLUDED FROM CLIENT BUNDLES & RESPONSES
// ==========================================================

export interface SecretCaseSolution {
  caseId: string;
  whoId: string;
  whoName: string;
  whenId: string;
  whenLabel: string;
  howId: string;
  howDescription: string;
  whyId: string;
  whyDescription: string;
  culpritSuspectId: string;
  requiredEvidenceIds: string[];
  rewardXp: number;
  rewardGold: number;
  rewardBadge: string;
}

export const SECRET_CASE_SOLUTIONS: Record<string, SecretCaseSolution> = {
  case_001: {
    caseId: 'case_001',
    whoId: 'susp_marcus',
    whoName: 'Marcus Vance',
    whenId: 'time_2225',
    whenLabel: '22:25 PM',
    howId: 'how_cyanide_pen_scotch',
    howDescription: "Laced Lord Arthur's fountain pen nib and crystal scotch tumbler with potassium cyanide",
    whyId: 'why_disinheritance_gambling_debt',
    whyDescription: 'Impending disinheritance in favor of Clara Giles and urgent debt to dockside bookmakers',
    culpritSuspectId: 'susp_marcus',
    requiredEvidenceIds: ['ev_01', 'ev_04', 'ev_05', 'ev_06'],
    // Strictly Authoritative intended Case #001 rewards
    rewardXp: 500,
    rewardGold: 250,
    rewardBadge: 'Blackwood Case Master Seal',
  },
  case_002: {
    caseId: 'case_002',
    whoId: 'susp_ross',
    whoName: 'Director Donald Ross',
    whenId: 'time_0245',
    whenLabel: '02:45 AM',
    howId: 'how_master_keycard_degausser',
    howDescription: 'Used curator master keycard and magnetic degausser to bypass biometric lock',
    whyId: 'why_forgery_offshore_payout',
    whyDescription: 'Swap genuine sapphire for forgery to satisfy offshore collector debt',
    culpritSuspectId: 'susp_ross',
    requiredEvidenceIds: [],
    rewardXp: 950,
    rewardGold: 500,
    rewardBadge: 'Silent Witness Seal',
  },
};

/**
 * Validates a submitted deduction against server-only canonical secrets.
 * Uses exact IDs — never loose string searches.
 */
export function validateDeductionServerOnly(
  caseId: string,
  submission: {
    whoId: string;
    whenId: string;
    howId: string;
    whyId: string;
    discoveredEvidenceIds: Set<string>;
    selectedEvidenceIds: string[];
  }
): {
  isCorrect: boolean;
  feedback: string;
  rewards?: { xp: number; gold: number; badge: string };
} {
  const secret = SECRET_CASE_SOLUTIONS[caseId];
  if (!secret) {
    return {
      isCorrect: false,
      feedback: 'Case dossier not recognized by Bureau forensics.',
    };
  }

  const { whoId, whenId, howId, whyId, discoveredEvidenceIds, selectedEvidenceIds } = submission;

  if (!whoId || !whenId || !howId || !whyId) {
    return {
      isCorrect: false,
      feedback: 'DEDUCTION INCOMPLETE: All four canonical deduction pillars (WHO, WHEN, HOW, WHY) are required.',
    };
  }

  if (whoId !== secret.whoId) {
    return {
      isCorrect: false,
      feedback: 'DEDUCTION FLAW [WHO]: The forensic evidence points toward an operative with direct opportunity and unverified movements.',
    };
  }

  if (whenId !== secret.whenId) {
    return {
      isCorrect: false,
      feedback: 'DEDUCTION FLAW [WHEN]: The established timeline contradicts verified logbook timestamps and physical evidence.',
    };
  }

  if (howId !== secret.howId) {
    return {
      isCorrect: false,
      feedback: 'DEDUCTION FLAW [HOW]: The execution method does not align with recovered physical instruments or lab toxicology.',
    };
  }

  if (whyId !== secret.whyId) {
    return {
      isCorrect: false,
      feedback: 'DEDUCTION FLAW [WHY]: The proposed motive fails to reconcile the documented financial urgencies or recovered communications.',
    };
  }

  // Verify all submitted evidence belongs to user's discovered evidence
  for (const evId of selectedEvidenceIds) {
    if (!discoveredEvidenceIds.has(evId)) {
      return {
        isCorrect: false,
        feedback: 'EVIDENCE REJECTED: One or more submitted clues have not been discovered in your active investigation.',
      };
    }
  }

  // Verify all mandatory required evidence items are present and discovered
  const selectedSet = new Set(selectedEvidenceIds);
  const missing = secret.requiredEvidenceIds.filter(
    (reqId) => !selectedSet.has(reqId) || !discoveredEvidenceIds.has(reqId)
  );

  if (missing.length > 0) {
    return {
      isCorrect: false,
      feedback: `DEDUCTION INCOMPLETE: You are missing ${missing.length} piece(s) of supporting forensic evidence on the board. Conduct further crime scene sweeps.`,
    };
  }

  return {
    isCorrect: true,
    feedback: `CASE SOLVED: Impeccable deduction, Detective. The evidence fully corroborates your accusation against ${secret.whoName}. The case is officially closed.`,
    rewards: {
      xp: secret.rewardXp,
      gold: secret.rewardGold,
      badge: secret.rewardBadge,
    },
  };
}
