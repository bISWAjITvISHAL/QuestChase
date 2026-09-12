import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { SERVER_CASES } from '@/lib/serverCaseData';

export async function GET(request: NextRequest) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json(
      { error: error || 'Authentication required to access case files' },
      { status: 401 }
    );
  }

  try {
    // 1. Fetch user's case progress
    const { data: progressList } = await client
      .from('case_progress')
      .select('*')
      .eq('user_id', user.id);

    // 2. Fetch discovered evidence
    const { data: evidenceList } = await client
      .from('discovered_evidence')
      .select('*')
      .eq('user_id', user.id);

    // 3. Fetch executed actions
    const { data: actionList } = await client
      .from('executed_actions')
      .select('*')
      .eq('user_id', user.id);

    // 4. Fetch connections
    const { data: connectionList } = await client
      .from('evidence_connections')
      .select('*')
      .eq('user_id', user.id);

    // Check if Case #001 is solved to gate subsequent cases
    const case001Solved = (progressList || []).some((p) => p.case_id === 'case_001' && p.is_solved);

    // Reconstruct canonical cases overlayed with genuine user database state
    const userCases = SERVER_CASES.map((baseCase) => {
      const caseProgress = (progressList || []).find((p) => p.case_id === baseCase.id);
      const caseDiscovered = (evidenceList || []).filter((e) => e.case_id === baseCase.id);
      const caseActions = (actionList || []).filter((a) => a.case_id === baseCase.id);
      const caseConnections = (connectionList || []).filter((c) => c.case_id === baseCase.id);

      const isSolved = caseProgress?.is_solved || false;
      const discoveredEvidenceIds = new Set(caseDiscovered.map((e) => e.evidence_id));
      const executedActionIds = new Set(caseActions.map((a) => a.action_id));

      // Case 002 Gate: Locked until Case 001 is officially solved
      const isLockedByPrerequisite = baseCase.id === 'case_002' && !case001Solved;

      const updatedEvidence = baseCase.evidence.map((ev) => {
        const disc = caseDiscovered.find((d) => d.evidence_id === ev.id);
        if (disc) {
          return {
            ...ev,
            isDiscovered: true,
            discoveredAt: disc.discovered_at,
            pinnedOnBoard: true,
            boardPosition: {
              x: disc.board_x ?? ev.boardPosition?.x ?? 100,
              y: disc.board_y ?? ev.boardPosition?.y ?? 100,
            },
          };
        }
        // Undiscovered: strictly masked, zero mystery clue details leaked
        return {
          id: ev.id,
          caseId: ev.caseId,
          chapterId: ev.chapterId,
          isDiscovered: false,
          pinnedOnBoard: false,
        };
      });

      const updatedActions = baseCase.actions.map((act) => {
        const isExecuted = executedActionIds.has(act.id);
        return {
          ...act,
          isExecuted,
          findingsReport: isExecuted ? act.findingsReport : undefined,
        };
      });

      const updatedConnections = (caseConnections || []).map((cn) => ({
        id: cn.id,
        caseId: cn.case_id,
        fromEvidenceId: cn.from_evidence_id,
        toEvidenceId: cn.to_evidence_id,
        isDeductionValid: cn.is_deduction_valid,
        discoveredAt: cn.created_at,
      }));

      // Case 002 Gate: Locked and Coming Soon
      if (baseCase.id === 'case_002') {
        return {
          id: 'case_002',
          code: 'CASE #002',
          title: 'THE SILENT WITNESS',
          subtitle: 'The Vault Breach at Zenith Gallery',
          synopsis: 'High-security biometric vault compromised during an art gala without triggering infrared alarms. Classified dossier under bureau preparation.',
          location: 'Zenith Gallery & High Vault',
          status: 'UNSOLVED' as const,
          currentChapterId: 'ch_02_01',
          reqRank: 'INVESTIGATOR' as const,
          rewardXp: 950,
          rewardGold: 500,
          rewardBadge: 'Silent Witness Seal',
          chapters: [
            {
              id: 'ch_02_01',
              caseId: 'case_002',
              chapterNumber: 1,
              title: 'The Vault Perimeter',
              objective: 'Classified dossier under bureau preparation. Coming soon.',
              isUnlocked: false,
              isCompleted: false,
              requiredEvidenceCount: 3,
            },
          ],
          suspects: [],
          evidence: [],
          actions: [],
          connections: [],
        };
      }

      // Calculate server-authoritative chapter unlocks based on current_chapter_id
      const currentChapterId = isSolved ? 'ch_04' : (caseProgress?.current_chapter_id || 'ch_01');
      const chapterOrder = ['ch_01', 'ch_02', 'ch_03', 'ch_04'];
      const currentIndex = chapterOrder.indexOf(currentChapterId);
      const activeIdx = currentIndex !== -1 ? currentIndex : 0;

      const updatedChapters = baseCase.chapters.map((ch, idx) => {
        const isUnlocked = idx <= activeIdx;
        const isCompleted = isSolved || idx < activeIdx;
        return {
          ...ch,
          isUnlocked,
          isCompleted,
        };
      });

      // Calculate progress percentage
      const totalEvidence = baseCase.evidence.length || 1;
      const progressPct = isSolved
        ? 100
        : Math.round((discoveredEvidenceIds.size / totalEvidence) * 100);

      // Sanitize suspects to guarantee culprit identity is never sent
      const sanitizedSuspects = baseCase.suspects.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        alibi: s.alibi,
        motiveSummary: s.motiveSummary,
        avatarUrl: s.avatarUrl,
        statusNotes: s.statusNotes,
      }));

      return {
        ...baseCase,
        status: isSolved
          ? ('SOLVED' as const)
          : progressPct > 0
          ? ('IN_PROGRESS' as const)
          : ('UNSOLVED' as const),
        currentChapterId,
        suspects: sanitizedSuspects,
        chapters: updatedChapters,
        evidence: updatedEvidence,
        actions: updatedActions,
        connections: updatedConnections,
      };
    });

    return NextResponse.json({ cases: userCases });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
