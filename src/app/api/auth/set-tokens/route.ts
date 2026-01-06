import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json();

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ success: false, message: 'Missing tokens' }, { status: 400 });
    }

    const cookieStore = await cookies();
    
    // Set httpOnly cookies (server-side)
    cookieStore.set({
      name: 'accessToken',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    cookieStore.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    // Also set non-httpOnly cookies for client-side access
    cookieStore.set({
      name: 'accessToken',
      value: accessToken,
      httpOnly: false, // Allow client-side access for axios interceptor
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    cookieStore.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: false, // Allow client-side access for refresh
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to set tokens' }, { status: 500 });
  }
}
