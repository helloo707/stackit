import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Answer from '@/models/Answer';
import Question from '@/models/Question';

type RepHistory = { change: number; createdAt: Date | string };

function getDateRange(range: string) {
  const now = new Date();
  if (range === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return weekAgo;
  } else if (range === 'month') {
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    return monthAgo;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const range = searchParams.get('range') || 'all';
    const since = getDateRange(range);

    let users;
    if (!since) {
      // All-time
      users = await User.find({ role: { $ne: 'admin' } })
        .sort({ reputation: -1 })
        .limit(limit)
        .select('name email image reputation')
        .lean();
      users = users.map(u => ({ ...u, periodReputation: u.reputation }));
    } else {
      // For week/month, calculate reputation, answers, questions in range
      const allUsers = await User.find({ role: { $ne: 'admin' } }).select('name email image reputationHistory reputation').lean();
      const usersWithRangeStats = await Promise.all(
        allUsers.map(async (u) => {
          const rep = (u.reputationHistory || []).filter((r: RepHistory) => new Date(r.createdAt) >= since).reduce((sum: number, r: RepHistory) => sum + r.change, 0);
          const answers = await Answer.countDocuments({ author: u._id, createdAt: { $gte: since } });
          const questions = await Question.countDocuments({ author: u._id, createdAt: { $gte: since } });
          return {
            _id: u._id?.toString(),
            name: u.name,
            email: u.email,
            image: u.image,
            reputation: u.reputation,
            periodReputation: rep,
            answers,
            questions,
          };
        })
      );
      users = usersWithRangeStats.sort((a, b) => b.periodReputation - a.periodReputation).slice(0, limit);
    }

    // For all-time, get answer/question counts
    if (!since) {
      const userIds = users.map(u => u._id);
      const answers = await Answer.aggregate([
        { $match: { author: { $in: userIds } } },
        { $group: { _id: '$author', count: { $sum: 1 } } }
      ]);
      const questions = await Question.aggregate([
        { $match: { author: { $in: userIds } } },
        { $group: { _id: '$author', count: { $sum: 1 } } }
      ]);
      const answerMap = Object.fromEntries(answers.map(a => [a._id.toString(), a.count]));
      const questionMap = Object.fromEntries(questions.map(q => [q._id.toString(), q.count]));
      users = users.map(u => ({
        ...u,
        answers: answerMap[u._id?.toString() || ''] || 0,
        questions: questionMap[u._id?.toString() || ''] || 0,
      }));
    }

    return NextResponse.json({ leaderboard: users });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 