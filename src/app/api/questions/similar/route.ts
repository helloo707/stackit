import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Question from '@/models/Question';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '';
    const content = searchParams.get('content') || '';
    if (!title && !content) {
      return NextResponse.json({ questions: [] });
    }
    // Use MongoDB text search for similar questions
    const searchText = [title, content].filter(Boolean).join(' ');
    const questions = await Question.find({
      $text: { $search: searchText },
      isDeleted: false,
    })
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .select('title _id createdAt')
      .lean();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error finding similar questions:', error);
    return NextResponse.json({ questions: [], error: 'Internal server error' }, { status: 500 });
  }
} 