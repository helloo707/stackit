import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Question from '@/models/Question';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id } = params;
    const { amount } = await request.json();
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Invalid bounty amount' }, { status: 400 });
    }
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    const question = await Question.findById(id);
    if (!question) return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    if (question.author.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Only the question author can offer a bounty' }, { status: 403 });
    }
    // Calculate new bounty amount
    const prevBounty = question.bounty?.amount || 0;
    const newBounty = prevBounty + amount;
    if (user.reputation < amount) {
      return NextResponse.json({ message: 'Not enough reputation to offer this bounty' }, { status: 400 });
    }
    // Deduct reputation
    user.reputation -= amount;
    user.reputationHistory = user.reputationHistory || [];
    user.reputationHistory.push({
      change: -amount,
      reason: 'Bounty offered',
      relatedQuestion: question._id,
      createdAt: new Date(),
    });
    // Update question bounty
    question.bounty = {
      amount: newBounty,
      status: 'open',
      awardedTo: question.bounty?.awardedTo,
      awardedAt: question.bounty?.awardedAt,
    };
    await user.save();
    await question.save();
    return NextResponse.json({ bounty: question.bounty, reputation: user.reputation });
  } catch (error) {
    console.error('Offer bounty error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 