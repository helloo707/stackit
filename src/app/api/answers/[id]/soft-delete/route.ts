import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Answer from '@/models/Answer';
import User from '@/models/User';

// POST - Soft delete an answer
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

    // Check if user is admin or the answer author
    const answer = await Answer.findById(params.id);
    if (!answer) {
      return NextResponse.json({ message: 'Answer not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && answer.author.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Soft delete the answer
    const updatedAnswer = await Answer.findByIdAndUpdate(
      params.id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Answer soft deleted successfully',
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error('Error soft deleting answer:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 