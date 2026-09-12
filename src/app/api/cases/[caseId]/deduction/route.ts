import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { validateDeductionServerOnly } from '@/lib/serverCaseSolutions';

interface RouteContext {
  params: { caseId: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
  }

  const { caseId } = params;
  if (!caseId) {
    return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
  }

  try {
    // 0. Enforce Backend Case Access & Lock Restrictions
    if (caseId === 'case_002') {
      return NextResponse.json(
        { error: 'Case Dossier Classified: Case #002 (The Silent Witness) is currently undergoing bureau preparation (Coming Soon) and cannot be deduced.' },
        { status: 403 }
      );
    }

    if (caseId !== 'case_001') {
      const { data: c1Progress } = await client
        .from('case_progress')
        .select('is_solved')
        .eq('user_id', user.id)
        .eq('case_id', 'case_001')
        .maybeSingle();

      if (!c1Progress?.is_solved) {
        return NextResponse.json(
          { error: `Case Dossier Locked: Clearance restricted until Case #001 (The Blackwood Murder) is officially solved.` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { whoId, whenId, howId, whyId, selectedEvidenceIds } = body;

    // 1. Fetch User Discovered Evidence
    const { data: userEvidence, error: userEvErr } = await client
      .from('discovered_evidence')
      .select('evidence_id')
      .eq('user_id', user.id)
      .eq('case_id', caseId);

    if (userEvErr) {
      return NextResponse.json({ error: userEvErr.message }, { status: 500 });
    }

    const userDiscoveredSet = new Set((userEvidence || []).map((e) => e.evidence_id));
    const submittedEvidenceList: string[] = Array.isArray(selectedEvidenceIds) ? selectedEvidenceIds : [];

    // 2. Server-Authoritative Secret Solution Validation
    const validation = validateDeductionServerOnly(caseId, {
      whoId,
      whenId,
      howId,
      whyId,
      discoveredEvidenceIds: userDiscoveredSet,
      selectedEvidenceIds: submittedEvidenceList,
    });

    if (!validation.isCorrect || !validation.rewards) {
      return NextResponse.json({
        isCorrect: false,
        feedback: validation.feedback,
      });
    }

    const { xp: rewardXp, gold: rewardGold, badge: rewardBadge } = validation.rewards;

    // 3. Pure Atomic PostgreSQL RPC execution (FOR UPDATE row-locked, concurrency-safe, transaction-atomic)
    const { data: rpcData, error: rpcError } = await client.rpc('solve_case_atomic', {
      p_user_id: user.id,
      p_case_id: caseId,
      p_reward_xp: rewardXp,
      p_reward_gold: rewardGold,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message || 'Case solving failed' }, { status: 500 });
    }

    if (!rpcData || !rpcData.success) {
      return NextResponse.json({ error: rpcData?.error || 'Case deduction rejected' }, { status: 400 });
    }

    return NextResponse.json({
      isCorrect: true,
      caseSolved: true,
      rewardXp,
      rewardGold,
      rewardBadge,
      profile: rpcData.profile,
      alreadySolved: rpcData.alreadySolved || false,
      feedback: rpcData.alreadySolved
        ? 'CASE ALREADY SOLVED: Case dossier is officially closed and sealed in the Bureau archives.'
        : validation.feedback,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

