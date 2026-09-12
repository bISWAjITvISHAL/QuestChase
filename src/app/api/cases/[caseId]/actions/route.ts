import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { SERVER_CASES, getServerEvidence } from '@/lib/serverCaseData';

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
    // 0. Gating & Clearance Restrictions
    if (caseId === 'case_002') {
      return NextResponse.json(
        { error: 'Case Dossier Classified: Case #002 (The Silent Witness) is currently undergoing bureau forensic preparation. Coming soon.' },
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
    const actionId = String(body.actionId || '').trim();

    if (!actionId) {
      return NextResponse.json({ error: 'Action ID is required' }, { status: 400 });
    }

    // 1. Locate canonical case and action definition for narrative details
    const targetCase = SERVER_CASES.find((c) => c.id === caseId);
    if (!targetCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const actionDef = targetCase.actions.find((a) => a.id === actionId);
    if (!actionDef) {
      return NextResponse.json({ error: 'Investigation action not found' }, { status: 404 });
    }

    // 2. Pure Atomic PostgreSQL RPC execution (Server-authoritative costs, attribute checks, equipment perks, evidence discovery)
    const { data: rpcData, error: rpcError } = await client.rpc('execute_investigation_action_atomic', {
      p_user_id: user.id,
      p_case_id: caseId,
      p_action_id: actionId,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message || 'Investigation action failed' }, { status: 500 });
    }

    if (!rpcData || !rpcData.success) {
      return NextResponse.json({ error: rpcData?.error || 'Investigation failed' }, { status: 400 });
    }

    // 3. Resolve the newly discovered canonical evidence definition
    const evidenceDef = getServerEvidence(caseId, actionDef.yieldsEvidenceId);
    const revealedEvidence = evidenceDef
      ? {
          ...evidenceDef,
          isDiscovered: true,
          discoveredAt: new Date().toISOString(),
          pinnedOnBoard: true,
        }
      : null;

    return NextResponse.json({
      ...rpcData,
      evidence: revealedEvidence,
      message: rpcData.alreadyExecuted
        ? `Action already conducted: ${actionDef.findingsReport}`
        : `Investigation Successful: ${actionDef.findingsReport}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

