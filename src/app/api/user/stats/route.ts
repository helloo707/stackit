import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import Bookmark from '@/models/Bookmark';

export async function GET() {
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

    // Get user statistics
    const [questionsAsked, answersGiven, bookmarksCount] = await Promise.all([
      Question.countDocuments({ author: user._id, isDeleted: false }),
      Answer.countDocuments({ author: user._id, isDeleted: false }),
      Bookmark.countDocuments({ user: user._id }),
    ]);

    // Calculate total votes from questions and answers
    const userQuestions = await Question.find({ author: user._id, isDeleted: false });
    const userAnswers = await Answer.find({ author: user._id, isDeleted: false });
    
    const questionVotes = userQuestions.reduce((total, q) => {
      return total + (q.votes?.upvotes?.length || 0) + (q.votes?.downvotes?.length || 0);
    }, 0);
    
    const answerVotes = userAnswers.reduce((total, a) => {
      return total + (a.votes?.upvotes?.length || 0) + (a.votes?.downvotes?.length || 0);
    }, 0);

    const totalVotes = questionVotes + answerVotes;

    // Calculate total views from questions
    const totalViews = userQuestions.reduce((total, q) => total + (q.views || 0), 0);

    return NextResponse.json({
      stats: {
        questionsAsked,
        answersGiven,
        totalVotes,
        totalViews,
        bookmarksCount,
        reputation: user.reputation || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 