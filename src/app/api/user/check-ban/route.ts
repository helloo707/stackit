import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ isBanned: false });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email })
      .select('isBanned bannedAt banReason bannedBy')
      .lean();

    if (!user) {
      return NextResponse.json({ isBanned: false });
    }

    // Type assertion to handle MongoDB return type
    const userDoc = user as any;

    // If user is banned and has bannedBy info, fetch the admin details
    let bannedByInfo = null;
    if (userDoc.isBanned && userDoc.bannedBy) {
      try {
        const bannedByUser = await User.findById(userDoc.bannedBy)
          .select('name email')
          .lean();
        bannedByInfo = bannedByUser;
      } catch (error) {
        console.error('Error fetching bannedBy user:', error);
      }
    }

    return NextResponse.json({
      isBanned: userDoc.isBanned || false,
      bannedAt: userDoc.bannedAt,
      banReason: userDoc.banReason,
      bannedBy: bannedByInfo,
    });
  } catch (error) {
    console.error('Error checking user ban status:', error);
    return NextResponse.json({ isBanned: false });
  }
} 