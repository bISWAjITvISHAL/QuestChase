import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';

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
    const { evidenceId, x, y } = body;

    if (!evidenceId || typeof x !== 'number' || typeof y !== 'number') {
      return NextResponse.json({ error: 'Valid evidenceId, x, and y are required' }, { status: 400 });
    }

    const { error: dbError } = await client
      .from('discovered_evidence')
      .update({
        board_x: x,
        board_y: y,
      })
      .eq('user_id', user.id)
      .eq('case_id', caseId)
      .eq('evidence_id', evidenceId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
