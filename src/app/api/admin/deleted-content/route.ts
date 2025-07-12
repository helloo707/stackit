import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import User from '@/models/User';

// GET - Fetch soft deleted content (admin only)
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

    // Only admins can view deleted content
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const contentType = searchParams.get('type') || 'all'; // 'questions', 'answers', or 'all'
    const skip = (page - 1) * limit;

    let deletedQuestions: any[] = [];
    let deletedAnswers: any[] = [];
    let totalQuestions = 0;
    let totalAnswers = 0;

    // Fetch deleted questions
    if (contentType === 'all' || contentType === 'questions') {
      deletedQuestions = await Question.find({ isDeleted: true })
        .populate('author', 'name email image')
        .sort({ deletedAt: -1 })
        .skip(contentType === 'questions' ? skip : 0)
        .limit(contentType === 'questions' ? limit : 10)
        .lean();

      totalQuestions = await Question.countDocuments({ isDeleted: true });
    }

    // Fetch deleted answers
    if (contentType === 'all' || contentType === 'answers') {
      deletedAnswers = await Answer.find({ isDeleted: true })
        .populate('author', 'name email image')
        .populate('question', 'title')
        .sort({ deletedAt: -1 })
        .skip(contentType === 'answers' ? skip : 0)
        .limit(contentType === 'answers' ? limit : 10)
        .lean();

      totalAnswers = await Answer.countDocuments({ isDeleted: true });
    }

    const total = totalQuestions + totalAnswers;
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      deletedQuestions,
      deletedAnswers,
      pagination: {
        page,
        limit,
        total,
        pages,
        totalQuestions,
        totalAnswers,
      },
    });
  } catch (error) {
    console.error('Error fetching deleted content:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 