import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Bookmark from '@/models/Bookmark';
import User from '@/models/User';

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