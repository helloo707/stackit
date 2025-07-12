import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Bookmark from '@/models/Bookmark';
import User from '@/models/User';
import Question from '@/models/Question';
import Notification from '@/models/Notification';

// GET - Fetch user's bookmarks
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const bookmarks = await Bookmark.find({ user: user._id })
      .populate({
        path: 'question',
        populate: {
          path: 'author',
          select: 'name email image'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Bookmark.countDocuments({ user: user._id });

    return NextResponse.json({
      bookmarks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a bookmark
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { questionId } = await request.json();

    if (!questionId) {
      return NextResponse.json(
        { message: 'Question ID is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if bookmark already exists
    const existingBookmark = await Bookmark.findOne({
      user: user._id,
      question: questionId,
    });

    if (existingBookmark) {
      return NextResponse.json(
        { message: 'Question already bookmarked' },
        { status: 400 }
      );
    }

    // Create new bookmark
    const bookmark = await Bookmark.create({
      user: user._id,
      question: questionId,
    });

    // Create notification for question author if the bookmarker is not the author
    const question = await Question.findById(questionId);
    if (question && question.author.toString() !== user._id.toString()) {
      try {
        // Create notification using Notification model
        await Notification.create({
          recipient: question.author,
          sender: user._id,
          type: 'bookmark',
          title: 'Question Bookmarked',
          message: `${user.name} bookmarked your question: "${question.title}"`,
          relatedQuestion: question._id,
          isRead: false,
          metadata: {
            questionTitle: question.title,
            senderName: user.name,
            senderImage: user.image,
            actionDetails: {
              who: user.name,
              what: 'bookmarked a question',
              where: question.title
            }
          },
        });

        console.log('Bookmark notification created successfully');
      } catch (notificationError) {
        console.error('Failed to create bookmark notification:', notificationError);
      }
    }

    return NextResponse.json({
      message: 'Question bookmarked successfully',
      bookmark,
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 