import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Answer from '@/models/Answer';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest';
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    // Build query
    const query: any = { 
      author: user._id, 
      isDeleted: false 
    };

    // Apply search filter
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    // Apply acceptance filter
    if (filter === 'accepted') {
      query.isAccepted = true;
    } else if (filter === 'not-accepted') {
      query.isAccepted = false;
    }

    // Build sort object
    let sortObject: any = {};
    switch (sort) {
      case 'newest':
        sortObject = { createdAt: -1 };
        break;
      case 'oldest':
        sortObject = { createdAt: 1 };
        break;
      case 'votes':
        sortObject = { 'votes.upvotes': -1, 'votes.downvotes': 1 };
        break;
      case 'accepted':
        sortObject = { isAccepted: -1, createdAt: -1 };
        break;
      default:
        sortObject = { createdAt: -1 };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [answers, total] = await Promise.all([
      Answer.find(query)
        .populate('author', 'name email image')
        .populate('question', 'title')
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean(),
      Answer.countDocuments(query)
    ]);

    // Calculate pagination info
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      answers,
      pagination: {
        page,
        limit,
        total,
        pages,
      }
    });
  } catch (error) {
    console.error('Error fetching user answers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 