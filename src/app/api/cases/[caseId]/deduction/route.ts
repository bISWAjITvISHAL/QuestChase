import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { INITIAL_CASES } from '@/lib/initialData';

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

    const targetCase = INITIAL_CASES.find((c) => c.id === caseId);
    if (!targetCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const { solution } = targetCase;

    // 1. Strict Deterministic Canonical ID Validation (Server-Authoritative - NO cross-case fallback)
    if (!solution || !solution.whoId || !solution.whenId || !solution.howId || !solution.whyId) {
      return NextResponse.json(
        { error: 'Case deduction configuration incomplete: Canonical solution not established for this dossier.' },
        { status: 500 }
      );
    }

    if (!whoId || !whenId || !howId || !whyId) {
      return NextResponse.json({
        isCorrect: false,
        feedback: 'DEDUCTION INCOMPLETE: All four canonical deduction pillars (WHO, WHEN, HOW, WHY) are required.',
      });
    }

    if (whoId !== solution.whoId) {
      return NextResponse.json({
        isCorrect: false,
        feedback:
          'DEDUCTION FLAW [WHO]: The forensic evidence points toward a different individual with direct access and opportunity.',
      });
    }

    if (whenId !== solution.whenId) {
      return NextResponse.json({
        isCorrect: false,
        feedback:
          'DEDUCTION FLAW [WHEN]: The timeline timestamp contradicts verified logbook records and witness movements.',
      });
    }

    if (howId !== solution.howId) {
      return NextResponse.json({
        isCorrect: false,
        feedback:
          'DEDUCTION FLAW [HOW]: The execution method does not align with physical scene forensics or recovered instruments.',
      });
    }

    if (whyId !== solution.whyId) {
      return NextResponse.json({
        isCorrect: false,
        feedback:
          'DEDUCTION FLAW [WHY]: The established motive fails to explain the documented financial interests or intercepted communications.',
      });
    }

    // 2. Strict Evidence Ownership & Discovery Validation
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

    // Verify submitted evidence IDs belong to user's discovered evidence
    for (const evId of submittedEvidenceList) {
      if (!userDiscoveredSet.has(evId)) {
        return NextResponse.json({
          isCorrect: false,
          feedback:
            'EVIDENCE VERIFICATION REJECTED: One or more submitted evidence threads have not been discovered in your active investigation.',
        });
      }
    }

    // Verify ALL mandatory required evidence items are present and discovered
    const submittedSet = new Set(submittedEvidenceList);
    const missingRequired = solution.requiredEvidenceIds.filter(
      (reqId) => !submittedSet.has(reqId) || !userDiscoveredSet.has(reqId)
    );

    if (missingRequired.length > 0) {
      return NextResponse.json({
        isCorrect: false,
        feedback: `DEDUCTION INCOMPLETE: You are missing ${missingRequired.length} required piece(s) of supporting forensic evidence (e.g. Broken Watch, Gatekeeper Log, or Cyanide Residue). Conduct further casework and scene forensics.`,
      });
    }

    const rewardXp = targetCase.rewardXp || 500;
    const rewardGold = targetCase.rewardGold || 250;

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
      rewardBadge: targetCase.rewardBadge,
      profile: rpcData.profile,
      alreadySolved: rpcData.alreadySolved || false,
      feedback: rpcData.alreadySolved
        ? 'CASE ALREADY SOLVED: Case dossier is officially closed and sealed in the Bureau archives.'
        : `CASE SOLVED: Brilliant deduction, Detective. Marcus Vance has been apprehended at the docklands attempting to board the midnight steamship. His confession matches the cyanide pen delivery and the intercepted codicil. The Blackwood case is officially CLOSED.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

