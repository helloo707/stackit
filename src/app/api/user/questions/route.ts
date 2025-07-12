import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Question from '@/models/Question';

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
    let query: any = { 
      author: user._id, 
      isDeleted: false 
    };

    // Apply search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Apply answer filter
    if (filter === 'unanswered') {
      query.answers = { $size: 0 };
    } else if (filter === 'answered') {
      query.answers = { $gt: { $size: 0 } };
    } else if (filter === 'no-answers') {
      query.answers = { $size: 0 };
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
      case 'views':
        sortObject = { views: -1 };
        break;
      case 'answers':
        sortObject = { 'answers': -1 };
        break;
      default:
        sortObject = { createdAt: -1 };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate('author', 'name email image')
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean(),
      Question.countDocuments(query)
    ]);

    // Calculate pagination info
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        pages,
      }
    });
  } catch (error) {
    console.error('Error fetching user questions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 