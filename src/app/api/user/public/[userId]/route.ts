import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Answer from '@/models/Answer';
import Question from '@/models/Question';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await dbConnect();
    const { userId } = params;
    const user = await User.findById(userId).select('name email image reputation createdAt').lean();
    if (!user || Array.isArray(user)) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const answersCount = await Answer.countDocuments({ author: user._id });
    const questionsCount = await Question.countDocuments({ author: user._id });
    return NextResponse.json({
      user: {
        _id: user._id?.toString(),
        name: user.name,
        image: user.image,
        reputation: user.reputation,
        answers: answersCount,
        questions: questionsCount,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('Error fetching public user profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 