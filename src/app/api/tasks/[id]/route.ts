import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
  }

  const taskId = params.id;
  if (!taskId) {
    return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updatePayload: Record<string, unknown> = {};

    const VALID_CATEGORIES = ['Intelligence', 'Perception', 'Discipline', 'Resilience'];
    const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    if (body.title !== undefined) {
      const trimmed = String(body.title).trim().substring(0, 120);
      if (trimmed.length > 0) updatePayload.title = trimmed;
    }
    if (body.description !== undefined) {
      updatePayload.description = String(body.description).trim().substring(0, 500);
    }
    if (body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(String(body.category))) {
        return NextResponse.json({ error: `Invalid category. Permitted: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
      }
      updatePayload.category = body.category;
    }
    if (body.priority !== undefined) {
      if (!VALID_PRIORITIES.includes(String(body.priority))) {
        return NextResponse.json({ error: `Invalid priority. Permitted: ${VALID_PRIORITIES.join(', ')}` }, { status: 400 });
      }
      updatePayload.priority = body.priority;
    }
    if (body.dueDate !== undefined || body.due_date !== undefined) {
      const val = body.dueDate ?? body.due_date;
      updatePayload.due_date = val ? new Date(val).toISOString() : null;
    }

    // Explicitly reject tampering with immutable/reward fields
    if (
      body.difficulty !== undefined ||
      body.is_completed !== undefined ||
      body.isCompleted !== undefined ||
      body.xp_reward !== undefined ||
      body.gold_reward !== undefined ||
      body.attribute_rewards !== undefined
    ) {
      return NextResponse.json(
        { error: 'Security Violation: Quest difficulty, rewards, and completion status cannot be modified directly.' },
        { status: 400 }
      );
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data: updated, error: dbError } = await client
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Quest not found or unauthorized' }, { status: 404 });
    }

    const mappedTask = {
      id: updated.id,
      userId: updated.user_id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      difficulty: updated.difficulty,
      priority: updated.priority,
      xpReward: updated.xp_reward,
      goldReward: updated.gold_reward,
      attributeRewards: updated.attribute_rewards,
      isCompleted: updated.is_completed,
      completedAt: updated.completed_at,
      createdAt: updated.created_at,
      dueDate: updated.due_date,
    };

    return NextResponse.json({ success: true, task: mappedTask });
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

  const taskId = params.id;
  if (!taskId) {
    return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
  }

  try {
    const { error: dbError } = await client
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: taskId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
