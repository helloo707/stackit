import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import Bookmark from '@/models/Bookmark';

export async function GET() {
  try {
    // Get the server-side session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Connect to database
    await dbConnect();

    // Fetch dashboard statistics
    const [
      totalUsers,
      totalQuestions,
      totalAnswers,
      totalBookmarks
    ] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      Answer.countDocuments(),
      Bookmark.countDocuments()
    ]);

    // Return dashboard stats
    return NextResponse.json({
      totalUsers,
      totalQuestions,
      totalAnswers,
      totalBookmarks
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 