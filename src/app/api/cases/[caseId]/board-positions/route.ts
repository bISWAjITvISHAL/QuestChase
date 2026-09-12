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
    const { evidenceId, x, y } = body;

    // Strict validation of coordinates and evidence ID
    if (
      !evidenceId ||
      typeof evidenceId !== 'string' ||
      !/^ev_[a-zA-Z0-9_-]+$/.test(evidenceId) ||
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      x > 3000 ||
      y < 0 ||
      y > 2500
    ) {
      return NextResponse.json(
        { error: 'Valid evidenceId and finite coordinate numbers within board bounds (0-3000 x 0-2500) are required' },
        { status: 400 }
      );
    }

    const { data: updatedRow, error: dbError } = await client
      .from('discovered_evidence')
      .update({
        board_x: Math.round(x),
        board_y: Math.round(y),
      })
      .eq('user_id', user.id)
      .eq('case_id', caseId)
      .eq('evidence_id', evidenceId)
      .select('evidence_id, board_x, board_y')
      .maybeSingle();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!updatedRow) {
      return NextResponse.json(
        { error: 'Evidence item not found or has not been discovered by this detective for this case' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, evidenceId: updatedRow.evidence_id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
