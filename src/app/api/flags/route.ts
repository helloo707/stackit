import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Flag from '@/models/Flag';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import User from '@/models/User';

// POST - Flag content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { contentType, contentId, reason } = await request.json();

    // Validation
    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { message: 'Content type, content ID, and reason are required' },
        { status: 400 }
      );
    }

    if (!['question', 'answer'].includes(contentType)) {
      return NextResponse.json(
        { message: 'Invalid content type' },
        { status: 400 }
      );
    }

    const validReasons = ['spam', 'inappropriate', 'offensive', 'duplicate', 'misleading', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { message: 'Invalid reason' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if content exists
    let content;
    if (contentType === 'question') {
      content = await Question.findById(contentId);
    } else {
      content = await Answer.findById(contentId);
    }

    if (!content) {
      return NextResponse.json(
        { message: 'Content not found' },
        { status: 404 }
      );
    }

    // Check if user already flagged this content
    const existingFlag = await Flag.findOne({
      contentType,
      contentId,
      reporter: user._id,
      status: { $in: ['pending', 'resolved'] }
    });

    if (existingFlag) {
      return NextResponse.json(
        { message: 'You have already flagged this content' },
        { status: 400 }
      );
    }

    // Create flag
    const flag = await Flag.create({
      contentType,
      contentId,
      reason,
      reporter: user._id,
    });

    // Populate reporter info
    const populatedFlag = await Flag.findById(flag._id)
      .populate('reporter', 'name email image')
      .lean();

    return NextResponse.json({
      message: 'Content flagged successfully',
      flag: populatedFlag,
    });
  } catch (error) {
    console.error('Error flagging content:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch flagged content (admin only)
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

    // Only admins can view flagged content
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'pending';
    const contentType = searchParams.get('type') || 'all';
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }
    if (contentType !== 'all') {
      query.contentType = contentType;
    }

    // Fetch flags with populated content and reporter
    const flags = await Flag.find(query)
      .populate('reporter', 'name email image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Manually populate content for each flag
    const populatedFlags = await Promise.all(
      flags.map(async (flag) => {
        try {
          if (!flag.contentId) {
            console.warn(`Flag ${flag._id} has no contentId`);
            return null;
          }

          let content;
          if (flag.contentType === 'question') {
            content = await Question.findById(flag.contentId)
              .select('title content author tags isDeleted')
              .populate('author', 'name email image')
              .lean();
          } else if (flag.contentType === 'answer') {
            content = await Answer.findById(flag.contentId)
              .select('content author question isDeleted')
              .populate('author', 'name email image')
              .populate('question', 'title')
              .lean();
          } else {
            console.warn(`Flag ${flag._id} has invalid contentType: ${flag.contentType}`);
            return null;
          }
          
          if (!content) {
            console.warn(`Content not found for flag ${flag._id}, contentId: ${flag.contentId}`);
            return null;
          }
          
          return {
            ...flag,
            contentId: content
          };
        } catch (error) {
          console.error(`Error populating content for flag ${flag._id}:`, error);
          return null;
        }
      })
    );

    // Filter out flags where content is soft deleted or missing
    const validFlags = populatedFlags.filter(flag => {
      return flag && flag.contentId && !(flag.contentId as any).isDeleted;
    });

    // Get total count
    const total = await Flag.countDocuments(query);

    return NextResponse.json({
      flags: validFlags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching flagged content:', error);
    
    // Log more specific error details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 