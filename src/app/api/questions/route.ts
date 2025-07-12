import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log("question function called")
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { title, content, tags, isAnonymous } = await request.json();

    // Validation
    if (!title?.trim() || !content?.trim() || !tags?.length) {
      return NextResponse.json(
        { message: 'Title, content, and tags are required' },
        { status: 400 }
      );
    }

    if (tags.length > 5) {
      return NextResponse.json(
        { message: 'Maximum 5 tags allowed' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Create question
    const question = await Question.create({
      title: title.trim(),
      content,
      author: user._id,
      tags: tags.map((tag: string) => tag.toLowerCase().trim()),
      isAnonymous: isAnonymous || false,
      votes: {
        upvotes: [],
        downvotes: [],
      },
      views: 0,
      answers: [],
      isDeleted: false,
    });

    return NextResponse.json({
      id: question._id,
      title: question.title,
      message: 'Question created successfully',
    });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest';
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = { isDeleted: false };

    if (search) {
      query.$text = { $search: search };
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    if (filter === 'unanswered') {
      query.answers = { $size: 0 };
    }

    // Build sort
    let sortQuery: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'votes':
        sortQuery = { 'votes.upvotes': -1, createdAt: -1 };
        break;
      case 'recent':
        sortQuery = { createdAt: -1 };
        break;
      case 'views':
        sortQuery = { views: -1, createdAt: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    // Execute query
    const questions = await Question.find(query)
      .populate('author', 'name email image')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Question.countDocuments(query);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 