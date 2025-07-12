import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import User from '@/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;
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
    const question = await Question.findById(id);
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

    if (answer.question.toString() !== id) {
      return NextResponse.json(
        { message: 'Answer does not belong to this question' },
        { status: 400 }
      );
    }

    // Unaccept any previously accepted answer for this question
    await Answer.updateMany(
      { question: id },
      { isAccepted: false }
    );

    // Accept the new answer
    const updatedAnswer = await Answer.findByIdAndUpdate(
      answerId,
      { isAccepted: true },
      { new: true }
    ).populate('author', 'name email image');

    // Update question with accepted answer
    await Question.findByIdAndUpdate(id, {
      acceptedAnswer: answerId,
    });

    // Create notification for answer author
    if (answer.author.toString() !== user._id.toString()) {
      try {
        const notificationResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'accept',
            title: 'Answer Accepted',
            message: `Your answer to the question "${question.title}" has been accepted.`,
            recipientId: answer.author,
            relatedQuestion: question._id,
            relatedAnswer: answer._id,
          }),
        });

        console.log('Answer acceptance notification creation response:', {
          status: notificationResponse.status,
          body: await notificationResponse.json(),
        });
      } catch (notificationError) {
        console.error('Failed to create answer acceptance notification:', notificationError);
      }
    }

    return NextResponse.json({
      message: 'Answer accepted successfully',
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error('Error accepting answer:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 