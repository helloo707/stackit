import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import User from '@/models/User';

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
    
    const { answerId } = await request.json();

    if (!answerId) {
      return NextResponse.json(
        { message: 'Answer ID is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if question exists and user is the author
    const question = await Question.findById(params.id);
    if (!question) {
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      );
    }

    if (question.author.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: 'Only the question author can accept answers' },
        { status: 403 }
      );
    }

    // Check if answer exists and belongs to this question
    const answer = await Answer.findById(answerId);
    if (!answer) {
      return NextResponse.json(
        { message: 'Answer not found' },
        { status: 404 }
      );
    }

    if (answer.question.toString() !== params.id) {
      return NextResponse.json(
        { message: 'Answer does not belong to this question' },
        { status: 400 }
      );
    }

    // Unaccept any previously accepted answer
    await Answer.updateMany(
      { question: params.id },
      { isAccepted: false }
    );

    // Accept the new answer
    await Answer.findByIdAndUpdate(answerId, { isAccepted: true });

    // Update question's accepted answer
    await Question.findByIdAndUpdate(params.id, {
      acceptedAnswer: answerId
    });

    return NextResponse.json({
      message: 'Answer accepted successfully',
    });
  } catch (error) {
    console.error('Error accepting answer:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 