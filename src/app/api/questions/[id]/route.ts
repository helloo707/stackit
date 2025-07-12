import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Increment view count
    await Question.findByIdAndUpdate(params.id, {
      $inc: { views: 1 }
    });
    
    const question = await Question.findById(params.id)
      .populate('author', 'name email image')
      .populate('acceptedAnswer', 'content author votes isAccepted createdAt')
      .lean();

    if (!question) {
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      );
    }

    // Get answers for this question
    const answers = await Answer.find({ 
      question: params.id,
      isDeleted: false 
    })
      .populate('author', 'name email image')
      .sort({ isAccepted: -1, 'votes.upvotes': -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      question,
      answers,
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { title, content, tags } = await request.json();

    if (!title?.trim() || !content?.trim() || !tags?.length) {
      return NextResponse.json(
        { message: 'Title, content, and tags are required' },
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
        { message: 'You can only edit your own questions' },
        { status: 403 }
      );
    }

    // Update question
    const updatedQuestion = await Question.findByIdAndUpdate(
      params.id,
      {
        title: title.trim(),
        content,
        tags: tags.map((tag: string) => tag.toLowerCase().trim()),
      },
      { new: true }
    ).populate('author', 'name email image');

    return NextResponse.json({
      message: 'Question updated successfully',
      question: updatedQuestion,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
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
        { message: 'You can only delete your own questions' },
        { status: 403 }
      );
    }

    // Soft delete question
    await Question.findByIdAndUpdate(params.id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    return NextResponse.json({
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 