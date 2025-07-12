import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import User from '@/models/User';

// POST - Soft delete a question
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

    // Check if user is admin or the question author
    const question = await Question.findById(params.id);
    if (!question) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && question.author.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Soft delete the question
    const updatedQuestion = await Question.findByIdAndUpdate(
      params.id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Question soft deleted successfully',
      question: updatedQuestion,
    });
  } catch (error) {
    console.error('Error soft deleting question:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 