import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import User from '@/models/User';
import mongoose from 'mongoose';
import Notification from '@/models/Notification';

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
    const { voteType } = await request.json(); // 'upvote' or 'downvote'

    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json(
        { message: 'Vote type must be "upvote" or "downvote"' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if question exists
    const question = await Question.findById(id);
    if (!question) {
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if user is voting on their own question
    if (question.author.toString() === user._id.toString()) {
      return NextResponse.json(
        { message: 'You cannot vote on your own question' },
        { status: 400 }
      );
    }

    const userId = user._id.toString();
    const upvotes = question.votes.upvotes.map((id: mongoose.Types.ObjectId) => id.toString());
    const downvotes = question.votes.downvotes.map((id: mongoose.Types.ObjectId) => id.toString());

    let updatedQuestion;

    if (voteType === 'upvote') {
      if (upvotes.includes(userId)) {
        // Remove upvote
        updatedQuestion = await Question.findByIdAndUpdate(
          id,
          {
            $pull: { 'votes.upvotes': user._id }
          },
          { new: true }
        ).populate('author', 'name email image');
      } else {
        // Add upvote, remove downvote if exists
        updatedQuestion = await Question.findByIdAndUpdate(
          id,
          {
            $addToSet: { 'votes.upvotes': user._id },
            $pull: { 'votes.downvotes': user._id }
          },
          { new: true }
        ).populate('author', 'name email image');
      }
    } else {
      if (downvotes.includes(userId)) {
        // Remove downvote
        updatedQuestion = await Question.findByIdAndUpdate(
          id,
          {
            $pull: { 'votes.downvotes': user._id }
          },
          { new: true }
        ).populate('author', 'name email image');
      } else {
        // Add downvote, remove upvote if exists
        updatedQuestion = await Question.findByIdAndUpdate(
          id,
          {
            $addToSet: { 'votes.downvotes': user._id },
            $pull: { 'votes.upvotes': user._id }
          },
          { new: true }
        ).populate('author', 'name email image');
      }
    }

    // Create notification for question author if the voter is not the author
    if (question.author.toString() !== user._id.toString()) {
      try {
        // Create notification using Notification model
        await Notification.create({
          recipient: question.author,
          sender: user._id,
          type: 'vote',
          title: 'Question Voted',
          message: `${user.name} ${voteType}d your question: "${question.title}"`,
          relatedQuestion: question._id,
          isRead: false,
          metadata: {
            questionTitle: question.title,
            senderName: user.name,
            senderImage: user.image,
            actionDetails: {
              who: user.name,
              what: `${voteType}d a question`,
              where: question.title
            }
          },
        });

        console.log('Question vote notification created successfully');
      } catch (notificationError) {
        console.error('Failed to create question vote notification:', notificationError);
      }
    }

    return NextResponse.json({
      message: 'Vote processed successfully',
      question: updatedQuestion,
    });
  } catch (error) {
    console.error('Error voting on question:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 