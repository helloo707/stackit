import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Flag from '@/models/Flag';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import User from '@/models/User';

// PUT - Update flag status and take moderation action
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
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Only admins can moderate flags
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { action, status } = await request.json();

    if (!action || !status) {
      return NextResponse.json(
        { message: 'Action and status are required' },
        { status: 400 }
      );
    }

    const validActions = ['dismiss', 'resolve', 'soft-delete', 'ban-user'];
    const validStatuses = ['pending', 'resolved', 'dismissed'];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action' },
        { status: 400 }
      );
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get the flag
    const flag = await Flag.findById(params.id)
      .populate('contentId')
      .populate('reporter', 'name email');

    if (!flag) {
      return NextResponse.json(
        { message: 'Flag not found' },
        { status: 404 }
      );
    }

    // Update flag status
    flag.status = status;
    await flag.save();

    // Take moderation action based on the action type
    let moderationResult = null;

    switch (action) {
      case 'soft-delete':
        if (flag.contentType === 'question') {
          await Question.findByIdAndUpdate(flag.contentId, {
            isDeleted: true,
            deletedAt: new Date(),
          });
        } else {
          await Answer.findByIdAndUpdate(flag.contentId, {
            isDeleted: true,
            deletedAt: new Date(),
          });
        }
        moderationResult = { action: 'soft-delete', contentId: flag.contentId };
        break;

      case 'ban-user':
        const contentAuthor = flag.contentType === 'question' 
          ? (flag.contentId as any).author 
          : (flag.contentId as any).author;
        
        await User.findByIdAndUpdate(contentAuthor, {
          isBanned: true,
          bannedAt: new Date(),
          banReason: `Content flagged as ${flag.reason}`,
        });
        moderationResult = { action: 'ban-user', userId: contentAuthor };
        break;

      case 'dismiss':
      case 'resolve':
        // Just update the flag status, no additional action needed
        moderationResult = { action: action };
        break;
    }

    return NextResponse.json({
      message: 'Flag updated successfully',
      flag,
      moderationResult,
    });
  } catch (error) {
    console.error('Error updating flag:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove flag (admin only)
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
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Only admins can delete flags
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const flag = await Flag.findByIdAndDelete(params.id);

    if (!flag) {
      return NextResponse.json(
        { message: 'Flag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Flag deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting flag:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 