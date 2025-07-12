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

    // Get recent questions
    const recentQuestions = await Question.find({ 
      author: user._id, 
      isDeleted: false 
    })
      .select('title content createdAt votes views')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent answers
    const recentAnswers = await Answer.find({ 
      author: user._id, 
      isDeleted: false 
    })
      .populate('question', 'title')
      .select('content createdAt votes question')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent bookmarks
    const recentBookmarks = await Bookmark.find({ user: user._id })
      .populate('question', 'title')
      .select('createdAt question')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Combine and format activities
    const activities = [
      ...recentQuestions.map(q => ({
        _id: q._id,
        type: 'question' as const,
        title: q.title,
        content: q.content,
        createdAt: q.createdAt,
        votes: (q.votes?.upvotes?.length || 0) + (q.votes?.downvotes?.length || 0),
        views: q.views || 0,
      })),
      ...recentAnswers.map(a => ({
        _id: a._id,
        type: 'answer' as const,
        title: `Answered: ${a.question?.title || 'Question'}`,
        content: a.content,
        createdAt: a.createdAt,
        votes: (a.votes?.upvotes?.length || 0) + (a.votes?.downvotes?.length || 0),
      })),
      ...recentBookmarks.map(b => ({
        _id: b._id,
        type: 'bookmark' as const,
        title: `Bookmarked: ${b.question?.title || 'Question'}`,
        createdAt: b.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, 10);

    return NextResponse.json({
      activity: activities
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 