import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
  }

  const taskId = params.id;
  if (!taskId) {
    return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
  }

  try {
    // Pure Atomic PostgreSQL RPC execution (FOR UPDATE row-locked, concurrency-safe, transaction-atomic)
    const { data: rpcData, error: rpcError } = await client.rpc('complete_quest_atomic', {
      p_user_id: user.id,
      p_task_id: taskId,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message || 'Quest completion failed' }, { status: 500 });
    }

    if (!rpcData || !rpcData.success) {
      return NextResponse.json({ error: rpcData?.error || 'Quest completion failed' }, { status: 400 });
    }

    return NextResponse.json(rpcData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

