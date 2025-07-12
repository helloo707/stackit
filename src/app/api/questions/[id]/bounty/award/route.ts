import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Question from '@/models/Question';
import Answer from '@/models/Answer';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id } = params;
    const { answerId } = await request.json();
    if (!answerId) {
      return NextResponse.json({ message: 'Answer ID is required' }, { status: 400 });
    }
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    const question = await Question.findById(id);
    if (!question) return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    if (question.author.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Only the question author can award the bounty' }, { status: 403 });
    }
    if (!question.bounty || question.bounty.amount <= 0 || question.bounty.status !== 'open') {
      return NextResponse.json({ message: 'No open bounty to award' }, { status: 400 });
    }
    const answer = await Answer.findById(answerId);
    if (!answer || answer.question.toString() !== question._id.toString()) {
      return NextResponse.json({ message: 'Answer not found for this question' }, { status: 404 });
    }
    const answerAuthor = await User.findById(answer.author);
    if (!answerAuthor) {
      return NextResponse.json({ message: 'Answer author not found' }, { status: 404 });
    }
    // Award bounty
    question.bounty.status = 'awarded';
    question.bounty.awardedTo = answerAuthor._id;
    question.bounty.awardedAt = new Date();
    await question.save();
    // Update answer author's reputation
    answerAuthor.reputation += question.bounty.amount;
    answerAuthor.reputationHistory = answerAuthor.reputationHistory || [];
    answerAuthor.reputationHistory.push({
      change: question.bounty.amount,
      reason: 'Bounty awarded',
      relatedQuestion: question._id,
      relatedAnswer: answer._id,
      createdAt: new Date(),
    });
    await answerAuthor.save();
    return NextResponse.json({ bounty: question.bounty, answerAuthor: { id: answerAuthor._id, reputation: answerAuthor.reputation } });
  } catch (error) {
    console.error('Award bounty error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 