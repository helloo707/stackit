import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Bookmark from '@/models/Bookmark';
import User from '@/models/User';

// DELETE - Remove a bookmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { questionId } = await params;
    const bookmark = await Bookmark.findOneAndDelete({
      user: user._id,
      question: questionId,
    });

    if (!bookmark) {
      return NextResponse.json(
        { message: 'Bookmark not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 