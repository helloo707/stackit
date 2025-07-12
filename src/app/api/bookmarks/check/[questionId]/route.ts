import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Bookmark from '@/models/Bookmark';
import User from '@/models/User';

// GET - Check if a question is bookmarked by the user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ isBookmarked: false });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ isBookmarked: false });
    }

    const { questionId } = await params;
    const bookmark = await Bookmark.findOne({
      user: user._id,
      question: questionId,
    });

    return NextResponse.json({
      isBookmarked: !!bookmark,
    });
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return NextResponse.json({ isBookmarked: false });
  }
} 