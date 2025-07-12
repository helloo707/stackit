import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'Not authenticated',
        cookies: request.headers.get('cookie') || 'No cookies found'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: session.user,
      message: 'Successfully authenticated'
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Server error',
      cookies: request.headers.get('cookie') || 'No cookies found'
    }, { status: 500 });
  }
} 