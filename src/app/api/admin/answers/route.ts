import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Answer from '@/models/Answer';
import User from '@/models/User';

// GET - Fetch all answers (admin only, including soft deleted)
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

    // Only admins can view all answers
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest';
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build query - include soft deleted answers for admin
    const query: Record<string, unknown> = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (filter === 'accepted') {
      query.isAccepted = true;
    } else if (filter === 'not-accepted') {
      query.isAccepted = false;
    }

    // Build sort object
    let sortObject: any = {};
    switch (sort) {
      case 'votes':
        sortObject = { 'votes.upvotes': -1, createdAt: -1 };
        break;
      case 'recent':
        sortObject = { createdAt: -1 };
        break;
      case 'oldest':
        sortObject = { createdAt: 1 };
        break;
      default:
        sortObject = { createdAt: -1 };
    }

    // Execute query - include soft deleted answers
    const answers = await Answer.find(query)
      .populate('author', 'name email image')
      .populate('question', 'title')
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Answer.countDocuments(query);

    return NextResponse.json({
      answers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin answers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 