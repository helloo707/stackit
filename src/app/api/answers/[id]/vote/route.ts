import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Answer from '@/models/Answer';
import User from '@/models/User';
import mongoose from 'mongoose';

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
    const answer = await Answer.findById(params.id);
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

    const userId = user._id;
    const upvotes = answer.votes.upvotes.map((id: mongoose.Types.ObjectId) => id.toString());
    const downvotes = answer.votes.downvotes.map((id: mongoose.Types.ObjectId) => id.toString());

    let updateQuery: Record<string, unknown> = {};

    if (voteType === 'upvote') {
      if (upvotes.includes(userId.toString())) {
        // Remove upvote
        updateQuery = {
          $pull: { 'votes.upvotes': userId }
        };
      } else {
        // Add upvote and remove downvote if exists
        updateQuery = {
          $addToSet: { 'votes.upvotes': userId },
          $pull: { 'votes.downvotes': userId }
        };
      }
    } else {
      if (downvotes.includes(userId.toString())) {
        // Remove downvote
        updateQuery = {
          $pull: { 'votes.downvotes': userId }
        };
      } else {
        // Add downvote and remove upvote if exists
        updateQuery = {
          $addToSet: { 'votes.downvotes': userId },
          $pull: { 'votes.upvotes': userId }
        };
      }
    }

    // Update answer votes
    const updatedAnswer = await Answer.findByIdAndUpdate(
      params.id,
      updateQuery,
      { new: true }
    ).populate('author', 'name email image');

    return NextResponse.json({
      message: 'Vote updated successfully',
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