import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Answer from '@/models/Answer';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const answer = await Answer.findById(params.id)
      .populate('author', 'name email image')
      .populate('question', 'title')
      .lean();

    if (!answer) {
      return NextResponse.json(
        { message: 'Answer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(answer);
  } catch (error) {
    console.error('Error fetching answer:', error);
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
    
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { message: 'Content is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if answer exists and user is the author
    const answer = await Answer.findById(params.id);
    if (!answer) {
      return NextResponse.json(
        { message: 'Answer not found' },
        { status: 404 }
      );
    }

    if (answer.author.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: 'You can only edit your own answers' },
        { status: 403 }
      );
    }

    // Update answer
    const updatedAnswer = await Answer.findByIdAndUpdate(
      params.id,
      { content: content.trim() },
      { new: true }
    ).populate('author', 'name email image');

    return NextResponse.json({
      message: 'Answer updated successfully',
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error('Error updating answer:', error);
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

    // Check if answer exists and user is the author
    const answer = await Answer.findById(params.id);
    if (!answer) {
      return NextResponse.json(
        { message: 'Answer not found' },
        { status: 404 }
      );
    }

    if (answer.author.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: 'You can only delete your own answers' },
        { status: 403 }
      );
    }

    // Soft delete answer
    await Answer.findByIdAndUpdate(params.id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    return NextResponse.json({
      message: 'Answer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting answer:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 