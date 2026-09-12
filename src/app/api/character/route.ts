import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json(
      { error: error || 'Authentication required to access detective dossier' },
      { status: 401 }
    );
  }

  try {
    const { data: profile, error: dbError } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Detective profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        badgeId: profile.badge_id,
        email: profile.email,
        rank: profile.rank,
        level: profile.level,
        xp: profile.xp,
        xpToNextLevel: profile.xp_to_next_level,
        gold: profile.gold,
        streak: profile.streak,
        lastActiveDate: profile.last_active_date,
        attributes: {
          intelligence: profile.intelligence,
          perception: profile.perception,
          discipline: profile.discipline,
          resilience: profile.resilience,
        },
        tasksCompletedCount: profile.tasks_completed_count,
        casesSolvedCount: profile.cases_solved_count,
        evidenceDiscoveredCount: profile.evidence_discovered_count,
        settings: profile.settings || { audioEnabled: true, ambienceEnabled: true, reducedMotion: false },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const updatePayload: Record<string, unknown> = {};

    if (body.name !== undefined) updatePayload.name = String(body.name).trim().substring(0, 60);
    if (body.settings !== undefined) updatePayload.settings = body.settings;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data: updated, error: dbError } = await client
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
