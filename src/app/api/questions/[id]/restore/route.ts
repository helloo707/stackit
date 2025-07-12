import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import User from '@/models/User';

// POST - Restore a soft deleted question
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

    // Only admins can restore questions
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const question = await Question.findById(params.id);
    if (!question) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    if (!question.isDeleted) {
      return NextResponse.json({ message: 'Question is not deleted' }, { status: 400 });
    }

    // Restore the question
    const updatedQuestion = await Question.findByIdAndUpdate(
      params.id,
      {
        isDeleted: false,
        $unset: { deletedAt: 1 },
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Question restored successfully',
      question: updatedQuestion,
    });
  } catch (error) {
    console.error('Error restoring question:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 