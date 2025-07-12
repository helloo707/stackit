import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Answer from '@/models/Answer';
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

    // Check if answer exists
    const answer = await Answer.findById(id);
    if (!answer) {
      return NextResponse.json(
        { message: 'Answer not found' },
        { status: 404 }
      );
    }

    // Check if user is voting on their own answer
    if (answer.author.toString() === user._id.toString()) {
      return NextResponse.json(
        { message: 'You cannot vote on your own answer' },
        { status: 400 }
      );
    }

    const userId = user._id.toString();
    const upvotes = answer.votes.upvotes.map((id: mongoose.Types.ObjectId) => id.toString());
    const downvotes = answer.votes.downvotes.map((id: mongoose.Types.ObjectId) => id.toString());

    let updatedAnswer;

    if (voteType === 'upvote') {
      if (upvotes.includes(userId)) {
        // Remove upvote
        updatedAnswer = await Answer.findByIdAndUpdate(
          id,
          {
            $pull: { 'votes.upvotes': user._id }
          },
          { new: true }
        ).populate('author', 'name email image');
      } else {
        // Add upvote, remove downvote if exists
        updatedAnswer = await Answer.findByIdAndUpdate(
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
        updatedAnswer = await Answer.findByIdAndUpdate(
          id,
          {
            $pull: { 'votes.downvotes': user._id }
          },
          { new: true }
        ).populate('author', 'name email image');
      } else {
        // Add downvote, remove upvote if exists
        updatedAnswer = await Answer.findByIdAndUpdate(
          id,
          {
            $addToSet: { 'votes.downvotes': user._id },
            $pull: { 'votes.upvotes': user._id }
          },
          { new: true }
        ).populate('author', 'name email image');
      }
    }

    // Create notification for answer author if the voter is not the author
    if (answer.author.toString() !== user._id.toString()) {
      try {
        // Create notification using Notification model
        await Notification.create({
          recipient: answer.author,
          sender: user._id,
          type: 'vote',
          title: 'Answer Voted',
          message: `${user.name} ${voteType}d your answer on "${answer.question.title}"`,
          relatedQuestion: answer.question,
          relatedAnswer: answer._id,
          isRead: false,
          metadata: {
            questionTitle: answer.question.title,
            answerSnippet: answer.content.length > 100 
              ? answer.content.substring(0, 100) + '...' 
              : answer.content,
            senderName: user.name,
            senderImage: user.image,
            actionDetails: {
              who: user.name,
              what: `${voteType}d an answer`,
              where: answer.question.title
            }
          },
        });

        console.log('Answer vote notification created successfully');
      } catch (notificationError) {
        console.error('Failed to create answer vote notification:', notificationError);
      }
    }

    return NextResponse.json({
      message: 'Vote processed successfully',
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error('Error voting on answer:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 