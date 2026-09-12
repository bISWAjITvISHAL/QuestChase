import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { TaskDifficulty, TaskCategory } from '@/lib/types';

// Server-side canonical reward rules
const DIFFICULTY_REWARDS: Record<TaskDifficulty, { xp: number; gold: number; attr: number }> = {
  E: { xp: 40, gold: 10, attr: 8 },
  D: { xp: 60, gold: 15, attr: 12 },
  C: { xp: 80, gold: 20, attr: 15 },
  B: { xp: 120, gold: 35, attr: 18 },
  A: { xp: 180, gold: 50, attr: 25 },
};

export async function GET(request: NextRequest) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json(
      { error: error || 'Authentication required to access casework' },
      { status: 401 }
    );
  }

  try {
    const { data: tasks, error: dbError } = await client
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const formatted = (tasks || []).map((t) => ({
      id: t.id,
      userId: t.user_id,
      title: t.title,
      description: t.description,
      category: t.category,
      difficulty: t.difficulty,
      priority: t.priority,
      xpReward: t.xp_reward,
      goldReward: t.gold_reward,
      attributeRewards: t.attribute_rewards || {},
      isCompleted: t.is_completed,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      dueDate: t.due_date,
    }));

    return NextResponse.json({ tasks: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json(
      { error: error || 'Authentication required to create casework' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const title = String(body.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'Quest title is required' }, { status: 400 });
    }

    const difficulty: TaskDifficulty = ['E', 'D', 'C', 'B', 'A'].includes(body.difficulty)
      ? body.difficulty
      : 'C';

    const category: TaskCategory = body.category || 'Discipline';
    const priority = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(body.priority)
      ? body.priority
      : 'MEDIUM';

    // Calculate server-authoritative rewards
    const rewardBase = DIFFICULTY_REWARDS[difficulty];
    const attrKey = ['Intelligence', 'Perception', 'Discipline', 'Resilience'].includes(category)
      ? category.toLowerCase()
      : 'discipline';

    const attributeRewards: Record<string, number> = {
      [attrKey]: rewardBase.attr,
    };

    const taskPayload = {
      user_id: user.id,
      title: title.substring(0, 120),
      description: body.description ? String(body.description).trim().substring(0, 500) : null,
      category,
      difficulty,
      priority,
      xp_reward: rewardBase.xp,
      gold_reward: rewardBase.gold,
      attribute_rewards: attributeRewards,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: dbError } = await client
      .from('tasks')
      .insert([taskPayload])
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      task: {
        id: inserted.id,
        userId: inserted.user_id,
        title: inserted.title,
        description: inserted.description,
        category: inserted.category,
        difficulty: inserted.difficulty,
        priority: inserted.priority,
        xpReward: inserted.xp_reward,
        goldReward: inserted.gold_reward,
        attributeRewards: inserted.attribute_rewards,
        isCompleted: inserted.is_completed,
        createdAt: inserted.created_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
