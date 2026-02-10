import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { fullName, phoneNumber } = await request.json();

    // Validate inputs
    if (!fullName || !phoneNumber) {
      return NextResponse.json(
        { error: 'Full name and phone number are required' },
        { status: 400 }
      );
    }

    // Get current user from auth token
    const token = request.cookies.get('auth_token')?.value;
    let userId = null;
    
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    // Validate Arabic text
    const arabicRegex = /[\u0600-\u06FF]/;
    if (!arabicRegex.test(fullName)) {
      return NextResponse.json(
        { error: 'Full name must be in Arabic' },
        { status: 400 }
      );
    }

    // Validate Moroccan phone number
    const phoneRegex = /^(\+212|0)[5-7]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid Moroccan phone number' },
        { status: 400 }
      );
    }

    // Check if phone number already has a request
    const { data: existingRequests } = await supabaseAdmin
      .from('access_requests')
      .select('id, status')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingRequests && existingRequests.length > 0) {
      const latestRequest = existingRequests[0];
      
      if (latestRequest.status === 'banned') {
        return NextResponse.json(
          { error: 'This phone number has been banned from the system' },
          { status: 403 }
        );
      }
      if (latestRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'A request with this phone number is already pending review' },
          { status: 409 }
        );
      }
      if (latestRequest.status === 'approved') {
        return NextResponse.json(
          { error: 'This phone number has already been approved. Please login.' },
          { status: 409 }
        );
      }
      // If status is 'denied', allow resubmitting a new request
    }

    // Create new access request
    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .insert([
        {
          user_id: userId,
          full_name_arabic: fullName,
          phone_number: phoneNumber,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating access request:', error);
      return NextResponse.json(
        { error: 'Failed to create access request' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Access request submitted successfully',
        requestId: data.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in access request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', payload.userId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all access requests
    const { data: requests, error } = await supabaseAdmin
      .from('access_requests')
      .select(`
        *,
        reviewed_by_user:reviewed_by(username)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching access requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch access requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error in access request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
