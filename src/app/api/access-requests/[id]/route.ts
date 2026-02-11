import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    if (!['approve', 'deny', 'ban'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, deny, or ban' },
        { status: 400 }
      );
    }

    // Get current user from auth token
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin or owner
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', payload.userId)
      .single();

    if (!user || !['admin', 'owner'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Map action to status
    const statusMap = {
      approve: 'approved',
      deny: 'denied',
      ban: 'banned',
    };

    const newStatus = statusMap[action as keyof typeof statusMap];

    // Update the access request
    const { data: updatedRequest, error } = await supabaseAdmin
      .from('access_requests')
      .update({
        status: newStatus,
        reviewed_by: payload.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating access request:', error);
      return NextResponse.json(
        { error: 'Failed to update access request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Request ${action}d successfully`,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Error in access request action API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
