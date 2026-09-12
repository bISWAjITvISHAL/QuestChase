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
    const fromId = String(body.fromEvidenceId || '').trim();
    const toId = String(body.toEvidenceId || '').trim();

    if (!fromId || !toId || fromId === toId) {
      return NextResponse.json({ error: 'Two distinct evidence IDs are required' }, { status: 400 });
    }

    const targetCase = INITIAL_CASES.find((c) => c.id === caseId);
    if (!targetCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const fromEv = targetCase.evidence.find((e) => e.id === fromId);
    const toEv = targetCase.evidence.find((e) => e.id === toId);
    if (!fromEv || !toEv) {
      return NextResponse.json({ error: 'Invalid evidence items' }, { status: 400 });
    }

    // Determine contradiction dynamically from structured case data
    const isContradiction =
      fromEv.contradictionPairId === toId || toEv.contradictionPairId === fromId;

    let deductionTitle = '';
    let message = `Red yarn thread connected: ${fromEv.title} ↔ ${toEv.title}`;

    if (isContradiction) {
      deductionTitle = `CRITICAL CONTRADICTION: ${fromEv.title} vs ${toEv.title}`;
      message = `BREAKTHROUGH: You uncovered the central contradiction! ${fromEv.title} directly disproves ${toEv.title}.`;
    }

    const { data: inserted, error: dbError } = await client
      .from('evidence_connections')
      .upsert(
        [
          {
            user_id: user.id,
            case_id: caseId,
            from_evidence_id: fromId,
            to_evidence_id: toId,
            is_deduction_valid: isContradiction,
            created_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id,case_id,from_evidence_id,to_evidence_id' }
      )
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      connection: {
        id: inserted.id,
        caseId: inserted.case_id,
        fromEvidenceId: inserted.from_evidence_id,
        toEvidenceId: inserted.to_evidence_id,
        isDeductionValid: inserted.is_deduction_valid,
        discoveredAt: inserted.created_at,
      },
      isDeduction: isContradiction,
      deductionTitle,
      message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
  }

  const { caseId } = params;
  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get('connectionId');

  if (!connectionId) {
    return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
  }

  try {
    const { error: dbError } = await client
      .from('evidence_connections')
      .delete()
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .eq('case_id', caseId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: connectionId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
