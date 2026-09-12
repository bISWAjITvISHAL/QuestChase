import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  const { user, error, client } = await getAuthenticatedUser(request);

  if (error || !user || !client) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
  }

  try {
    const { data: inventory, error: invError } = await client
      .from('user_inventory')
      .select('item_id, is_equipped, acquired_at')
      .eq('user_id', user.id);

    if (invError) {
      return NextResponse.json({ error: invError.message }, { status: 500 });
    }

    let items = inventory || [];
    // Ensure starter equipment (Field Magnifying Glass) is provisioned
    if (!items.some((i) => i.item_id === 'eq_magnifying_glass')) {
      const { data: starterItem } = await client
        .from('user_inventory')
        .insert({
          user_id: user.id,
          item_id: 'eq_magnifying_glass',
          is_equipped: true,
        })
        .select('item_id, is_equipped, acquired_at')
        .maybeSingle();

      if (starterItem) {
        items = [...items, starterItem];
      }
    }

    return NextResponse.json({ items });
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
    const body = await request.json();
    const { action, itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    if (action === 'purchase') {
      const { data, error: rpcErr } = await client.rpc('purchase_equipment_atomic', {
        p_user_id: user.id,
        p_item_id: itemId,
      });

      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      if (!data || !data.success) {
        return NextResponse.json({ error: data?.error || 'Requisition failed' }, { status: 400 });
      }

      return NextResponse.json(data);
    } else if (action === 'equip') {
      const { data, error: rpcErr } = await client.rpc('toggle_equip_item_atomic', {
        p_user_id: user.id,
        p_item_id: itemId,
      });

      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      if (!data || !data.success) {
        return NextResponse.json({ error: data?.error || 'Equip toggle failed' }, { status: 400 });
      }

      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: 'Invalid inventory action. Must be purchase or equip' }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
