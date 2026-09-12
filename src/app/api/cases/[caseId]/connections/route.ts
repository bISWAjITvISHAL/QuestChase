import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { SERVER_CASES } from '@/lib/serverCaseData';

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
    const fromId = String(body.fromEvidenceId || '').trim();
    const toId = String(body.toEvidenceId || '').trim();

    if (!fromId || !toId || fromId === toId) {
      return NextResponse.json({ error: 'Two distinct evidence IDs are required' }, { status: 400 });
    }

    const targetCase = SERVER_CASES.find((c) => c.id === caseId);
    if (!targetCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const fromEv = targetCase.evidence.find((e) => e.id === fromId);
    const toEv = targetCase.evidence.find((e) => e.id === toId);
    if (!fromEv || !toEv) {
      return NextResponse.json({ error: 'Invalid evidence items' }, { status: 400 });
    }

    // 1. Evidence Discovery Verification: User MUST have discovered BOTH clues before linking them
    const { data: discoveredList, error: discErr } = await client
      .from('discovered_evidence')
      .select('evidence_id')
      .eq('user_id', user.id)
      .eq('case_id', caseId)
      .in('evidence_id', [fromId, toId]);

    if (discErr) {
      return NextResponse.json({ error: discErr.message }, { status: 500 });
    }

    const discoveredSet = new Set((discoveredList || []).map((d) => d.evidence_id));
    if (!discoveredSet.has(fromId) || !discoveredSet.has(toId)) {
      return NextResponse.json(
        { error: 'Cannot connect clues that have not been discovered through investigation.' },
        { status: 400 }
      );
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

    let connectionId: string = '';
    let createdAt: string = new Date().toISOString();
    let unlockedAchievements: any[] = [];

    // 2. Pure Atomic PostgreSQL RPC execution (transactional connection + achievement evaluation)
    const { data: rpcData, error: rpcError } = await client.rpc('create_evidence_connection_atomic', {
      p_user_id: user.id,
      p_case_id: caseId,
      p_from_id: fromId,
      p_to_id: toId,
      p_is_deduction_valid: isContradiction,
    });

    if (!rpcError && rpcData?.success) {
      connectionId = rpcData.connectionId;
      if (rpcData.createdAt) createdAt = rpcData.createdAt;
      if (Array.isArray(rpcData.unlockedAchievements)) {
        unlockedAchievements = rpcData.unlockedAchievements;
      }
    } else {
      // Fallback if RPC migration is still propagating
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
              created_at: createdAt,
            },
          ],
          { onConflict: 'user_id,case_id,from_evidence_id,to_evidence_id' }
        )
        .select()
        .single();

      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }

      connectionId = inserted.id;
      createdAt = inserted.created_at;

      try {
        const { data: achData } = await client.rpc('check_and_unlock_achievements', {
          p_user_id: user.id,
        });
        if (Array.isArray(achData)) {
          unlockedAchievements = achData;
        }
      } catch {
        // Log achievement check note
      }
    }

    return NextResponse.json({
      success: true,
      connection: {
        id: connectionId,
        caseId: caseId,
        fromEvidenceId: fromId,
        toEvidenceId: toId,
        isDeductionValid: isContradiction,
        discoveredAt: createdAt,
      },
      isDeduction: isContradiction,
      deductionTitle,
      message,
      unlockedAchievements,
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
