import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Answer from '@/models/Answer';
import Question from '@/models/Question';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { questionId, content } = await request.json();

    // Validation
    if (!questionId || !content?.trim()) {
      return NextResponse.json(
        { message: 'Question ID and content are required' },
        { status: 400 }
      );
    }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Create answer
    const answer = await Answer.create({
      content: content.trim(),
      author: user._id,
      question: questionId,
      votes: {
        upvotes: [],
        downvotes: [],
      },
      isAccepted: false,
      isDeleted: false,
    });

    // Add answer to question's answers array
    await Question.findByIdAndUpdate(questionId, {
      $push: { answers: answer._id }
    });

    // Populate author info for response
    const populatedAnswer = await Answer.findById(answer._id)
      .populate('author', 'name email image')
      .lean();

    if (!populatedAnswer) {
      return NextResponse.json(
        { message: 'Failed to create answer' },
        { status: 500 }
      );
    }

    // Create notification for question author if the answerer is not the author
    if (user._id.toString() !== question.author.toString()) {
      try {
        // Create notification using Notification model
        await Notification.create({
          recipient: question.author,
          sender: user._id,
          type: 'answer',
          title: 'New Answer Added',
          message: `${user.name} answered your question: "${question.title}"`,
          relatedQuestion: question._id,
          relatedAnswer: answer._id,
          isRead: false,
          metadata: {
            questionTitle: question.title,
            answerSnippet: answer.content.length > 100 
              ? answer.content.substring(0, 100) + '...' 
              : answer.content,
            senderName: user.name,
            senderImage: user.image,
            actionDetails: {
              who: user.name,
              what: 'answered a question',
              where: question.title
            }
          },
        });

        console.log('Answer notification created successfully');
      } catch (notificationError) {
        console.error('Failed to create answer notification:', notificationError);
      }
    }

    return NextResponse.json({
      id: answer._id,
      message: 'Answer created successfully',
      answer: populatedAnswer,
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest';

    if (!questionId) {
      return NextResponse.json(
        { message: 'Question ID is required' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build query
    const query = { 
      question: questionId,
      isDeleted: false 
    };

    // Build sort
    let sortQuery: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'votes':
        sortQuery = { 'votes.upvotes': -1, createdAt: -1 };
        break;
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'accepted':
        sortQuery = { isAccepted: -1, createdAt: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    // Execute query
    const answers = await Answer.find(query)
      .populate('author', 'name email image')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Answer.countDocuments(query);

    return NextResponse.json({
      answers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching answers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 