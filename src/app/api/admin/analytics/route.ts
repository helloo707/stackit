import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import Flag from '@/models/Flag';
import Bookmark from '@/models/Bookmark';

// GET - Fetch analytics data (admin only)
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

    // Only admins can view analytics
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Basic counts
    const [
      totalUsers,
      totalQuestions,
      totalAnswers,
      totalFlags,
      totalBookmarks,
      bannedUsers,
      activeUsers,
      adminUsers,
      deletedQuestions,
      deletedAnswers,
      acceptedAnswers,
      pendingFlags
    ] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      Answer.countDocuments(),
      Flag.countDocuments(),
      Bookmark.countDocuments(),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isBanned: false }),
      User.countDocuments({ role: 'admin' }),
      Question.countDocuments({ isDeleted: true }),
      Answer.countDocuments({ isDeleted: true }),
      Answer.countDocuments({ isAccepted: true }),
      Flag.countDocuments({ status: 'pending' })
    ]);

    // Recent activity (last 30 days by default)
    const [
      newUsers,
      newQuestions,
      newAnswers,
      newFlags,
      newBookmarks
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Question.countDocuments({ createdAt: { $gte: startDate } }),
      Answer.countDocuments({ createdAt: { $gte: startDate } }),
      Flag.countDocuments({ createdAt: { $gte: startDate } }),
      Bookmark.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    // User engagement metrics
    const [
      usersWithQuestions,
      usersWithAnswers,
      usersWithBookmarks,
      topReputationUsers
    ] = await Promise.all([
      User.countDocuments({ 
        $or: [
          { $expr: { $and: [{ $isArray: '$questions' }, { $gt: [{ $size: '$questions' }, 0] }] } },
          { $expr: { $and: [{ $isArray: '$answers' }, { $gt: [{ $size: '$answers' }, 0] }] } }
        ]
      }),
      User.countDocuments({ $expr: { $and: [{ $isArray: '$answers' }, { $gt: [{ $size: '$answers' }, 0] }] } }),
      User.countDocuments({ $expr: { $and: [{ $isArray: '$bookmarks' }, { $gt: [{ $size: '$bookmarks' }, 0] }] } }),
      User.find({ role: { $ne: 'admin' } })
        .sort({ reputation: -1 })
        .limit(10)
        .select('name email reputation')
        .lean()
    ]);

    // Content quality metrics
    const [
      questionsWithAnswers,
      questionsWithoutAnswers,
      averageAnswersPerQuestion,
      averageVotesPerQuestion,
      averageVotesPerAnswer
    ] = await Promise.all([
      Question.countDocuments({ $expr: { $and: [{ $isArray: '$answers' }, { $gt: [{ $size: '$answers' }, 0] }] } }),
      Question.countDocuments({ $expr: { $and: [{ $isArray: '$answers' }, { $eq: [{ $size: '$answers' }, 0] }] } }),
      Question.aggregate([
        {
          $group: {
            _id: null,
            avgAnswers: { $avg: { $size: '$answers' } }
          }
        }
      ]),
      Question.aggregate([
        {
          $group: {
            _id: null,
            avgVotes: { $avg: { $add: [{ $size: { $ifNull: ['$votes.upvotes', []] } }, { $size: { $ifNull: ['$votes.downvotes', []] } }] } }
          }
        }
      ]),
      Answer.aggregate([
        {
          $group: {
            _id: null,
            avgVotes: { $avg: { $add: [{ $size: { $ifNull: ['$votes.upvotes', []] } }, { $size: { $ifNull: ['$votes.downvotes', []] } }] } }
          }
        }
      ])
    ]);

    // Flag analysis
    const flagReasons = await Flag.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const flagStatuses = await Flag.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Growth trends (last 7 days)
    const growthData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [dailyUsers, dailyQuestions, dailyAnswers] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Question.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Answer.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } })
      ]);

      growthData.push({
        date: dayStart.toISOString().split('T')[0],
        users: dailyUsers,
        questions: dailyQuestions,
        answers: dailyAnswers
      });
    }

    return NextResponse.json({
      overview: {
        totalUsers,
        totalQuestions,
        totalAnswers,
        totalFlags,
        totalBookmarks,
        bannedUsers,
        activeUsers,
        adminUsers,
        deletedQuestions,
        deletedAnswers,
        acceptedAnswers,
        pendingFlags
      },
      recentActivity: {
        period: parseInt(period),
        newUsers,
        newQuestions,
        newAnswers,
        newFlags,
        newBookmarks
      },
      engagement: {
        usersWithQuestions,
        usersWithAnswers,
        usersWithBookmarks,
        topReputationUsers
      },
      contentQuality: {
        questionsWithAnswers,
        questionsWithoutAnswers,
        averageAnswersPerQuestion: averageAnswersPerQuestion[0]?.avgAnswers || 0,
        averageVotesPerQuestion: averageVotesPerQuestion[0]?.avgVotes || 0,
        averageVotesPerAnswer: averageVotesPerAnswer[0]?.avgVotes || 0
      },
      moderation: {
        flagReasons,
        flagStatuses
      },
      growthTrends: growthData
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 