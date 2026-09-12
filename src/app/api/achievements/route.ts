import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
  }

  try {
    // Proactively evaluate any newly qualified achievements based on actual DB records
    try {
      await client.rpc('check_and_unlock_achievements', { p_user_id: user.id });
    } catch {
      // Non-blocking fallback
    }

    const { data: achievements, error: achError } = await client
      .from('user_achievements')
      .select('achievement_id, is_unlocked, progress, unlocked_at')
      .eq('user_id', user.id);

    if (achError) {
      return NextResponse.json({ error: achError.message }, { status: 500 });
    }

    return NextResponse.json({ achievements: achievements || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { achievementId } = body;

    // Evaluate qualifying achievements strictly from database state
    const { data: unlockedData, error: rpcErr } = await client.rpc('check_and_unlock_achievements', {
      p_user_id: user.id,
    });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    const newlyUnlocked = Array.isArray(unlockedData) ? unlockedData : [];

    // If client requested a specific achievement, verify if it is indeed unlocked in the database
    if (achievementId) {
      const { data: userAch } = await client
        .from('user_achievements')
        .select('achievement_id, is_unlocked')
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId)
        .eq('is_unlocked', true)
        .maybeSingle();

      if (!userAch) {
        return NextResponse.json(
          {
            success: false,
            error: 'Clearance Denied: Achievement prerequisites have not been satisfied in bureau records.',
          },
          { status: 400 }
        );
      }
    }

    // Fetch updated achievements list
    const { data: currentAchievements } = await client
      .from('user_achievements')
      .select('achievement_id, is_unlocked, progress, unlocked_at')
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      newlyUnlocked,
      achievements: currentAchievements || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
