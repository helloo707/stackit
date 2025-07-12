import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Answer from '@/models/Answer';
import User from '@/models/User';

// POST - Restore a soft deleted answer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only admins can restore answers
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const answer = await Answer.findById(params.id);
    if (!answer) {
      return NextResponse.json({ message: 'Answer not found' }, { status: 404 });
    }

    if (!answer.isDeleted) {
      return NextResponse.json({ message: 'Answer is not deleted' }, { status: 400 });
    }

    // Restore the answer
    const updatedAnswer = await Answer.findByIdAndUpdate(
      params.id,
      {
        isDeleted: false,
        $unset: { deletedAt: 1 },
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Answer restored successfully',
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error('Error restoring answer:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 