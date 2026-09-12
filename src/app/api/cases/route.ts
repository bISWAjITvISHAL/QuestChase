import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { INITIAL_CASES } from '@/lib/initialData';

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

    // Reconstruct canonical cases overlayed with genuine user database state
    const userCases = INITIAL_CASES.map((baseCase) => {
      const caseProgress = (progressList || []).find((p) => p.case_id === baseCase.id);
      const caseDiscovered = (evidenceList || []).filter((e) => e.case_id === baseCase.id);
      const caseActions = (actionList || []).filter((a) => a.case_id === baseCase.id);
      const caseConnections = (connectionList || []).filter((c) => c.case_id === baseCase.id);

      const isSolved = caseProgress?.is_solved || false;
      const discoveredEvidenceIds = new Set(caseDiscovered.map((e) => e.evidence_id));
      const executedActionIds = new Set(caseActions.map((a) => a.action_id));

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
        return {
          ...ev,
          isDiscovered: false,
          pinnedOnBoard: false,
        };
      });

      const updatedActions = baseCase.actions.map((act) => ({
        ...act,
        isExecuted: executedActionIds.has(act.id),
      }));

      const updatedConnections = (caseConnections || []).map((cn) => ({
        id: cn.id,
        caseId: cn.case_id,
        fromEvidenceId: cn.from_evidence_id,
        toEvidenceId: cn.to_evidence_id,
        isDeductionValid: cn.is_deduction_valid,
        discoveredAt: cn.created_at,
      }));

      // Calculate progress percentage
      const totalEvidence = baseCase.evidence.length || 1;
      const progressPct = isSolved
        ? 100
        : Math.round((discoveredEvidenceIds.size / totalEvidence) * 100);

      return {
        ...baseCase,
        status: isSolved ? ('SOLVED' as const) : progressPct > 0 ? ('IN_PROGRESS' as const) : ('UNSOLVED' as const),
        currentChapterId: caseProgress?.current_chapter_id || baseCase.currentChapterId,
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
