import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import Answer from '@/models/Answer';
import User from '@/models/User';

// Create a comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { answerId, content, mentions, parent } = await request.json();
    if (!answerId || !content?.trim()) {
      return NextResponse.json({ message: 'Answer ID and content are required' }, { status: 400 });
    }
    // Check if answer exists
    const answer = await Answer.findById(answerId);
    if (!answer) {
      return NextResponse.json({ message: 'Answer not found' }, { status: 404 });
    }
    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    // Create comment
    const comment = await Comment.create({
      content: content.trim(),
      author: user._id,
      answer: answerId,
      mentions: mentions || [],
      parent: parent || null,
      isDeleted: false,
    });
    // Populate author for response
    const populated = await Comment.findById(comment._id).populate('author', 'name email image').lean();
    return NextResponse.json({ comment: populated }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Fetch comments for an answer
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const answerId = searchParams.get('answerId');
    if (!answerId) {
      return NextResponse.json({ message: 'Answer ID is required' }, { status: 400 });
    }
    const comments = await Comment.find({ answer: answerId, isDeleted: false })
      .populate('author', 'name email image')
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Soft delete a comment (by id, only by author)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { commentId } = await request.json();
    if (!commentId) {
      return NextResponse.json({ message: 'Comment ID is required' }, { status: 400 });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    }
    // Only author can delete
    const user = await User.findOne({ email: session.user.email });
    if (!user || comment.author.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();
    return NextResponse.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Add PATCH handler for editing a comment
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { commentId, content } = await request.json();
    if (!commentId || !content?.trim()) {
      return NextResponse.json({ message: 'Comment ID and new content are required' }, { status: 400 });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    }
    // Only author can edit
    const user = await User.findOne({ email: session.user.email });
    if (!user || comment.author.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    comment.content = content.trim();
    comment.edited = true;
    comment.updatedAt = new Date();
    await comment.save();
    const populated = await Comment.findById(comment._id).populate('author', 'name email image').lean();
    return NextResponse.json({ comment: populated });
  } catch (error) {
    console.error('Error editing comment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 