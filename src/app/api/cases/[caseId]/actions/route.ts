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
    const actionId = String(body.actionId || '').trim();

    if (!actionId) {
      return NextResponse.json({ error: 'Action ID is required' }, { status: 400 });
    }

    // 1. Locate canonical case and action definition (Server-Authoritative)
    const targetCase = INITIAL_CASES.find((c) => c.id === caseId);
    if (!targetCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const actionDef = targetCase.actions.find((a) => a.id === actionId);
    if (!actionDef) {
      return NextResponse.json({ error: 'Investigation action not found' }, { status: 404 });
    }

    // 2. Attribute validation check
    const { data: profile, error: profileErr } = await client
      .from('profiles')
      .select('intelligence, perception, discipline, resilience, gold')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 500 });
    }

    if (actionDef.reqAttributes) {
      let meetsPrimary = true;
      for (const [key, reqVal] of Object.entries(actionDef.reqAttributes)) {
        const currentVal = (profile as Record<string, unknown>)[key] as number || 0;
        if (currentVal < (reqVal || 0)) {
          meetsPrimary = false;
          break;
        }
      }

      let meetsAlternate = false;
      if (!meetsPrimary && actionDef.alternateRoute) {
        meetsAlternate = true;
        for (const [key, reqVal] of Object.entries(actionDef.alternateRoute.reqAttributes)) {
          const currentVal = (profile as Record<string, unknown>)[key] as number || 0;
          if (currentVal < (reqVal || 0)) {
            meetsAlternate = false;
            break;
          }
        }
      }

      if (!meetsPrimary && !meetsAlternate) {
        const reqStr = Object.entries(actionDef.reqAttributes)
          .map(([k, v]) => `${k.toUpperCase()} ${v}`)
          .join(', ');
        return NextResponse.json(
          { error: `Investigation Method Locked: Requires ${reqStr}. Complete casework to build attributes.` },
          { status: 400 }
        );
      }
    }

    // Derive costs and evidence strictly server-side from canonical definition
    const costGold = actionDef.costGold || 50;

    // 3. Pure Atomic PostgreSQL RPC execution (FOR UPDATE row-locked, concurrency-safe, transaction-atomic)
    const { data: rpcData, error: rpcError } = await client.rpc('execute_investigation_action_atomic', {
      p_user_id: user.id,
      p_case_id: caseId,
      p_action_id: actionId,
      p_gold_cost: costGold,
      p_yields_evidence_id: actionDef.yieldsEvidenceId,
      p_total_case_evidence: targetCase.evidence.length,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message || 'Investigation action failed' }, { status: 500 });
    }

    if (!rpcData || !rpcData.success) {
      return NextResponse.json({ error: rpcData?.error || 'Investigation failed' }, { status: 400 });
    }

    return NextResponse.json({
      ...rpcData,
      message: rpcData.alreadyExecuted
        ? `Action already conducted: ${actionDef.findingsReport}`
        : `Investigation Successful: ${actionDef.findingsReport}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

