import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Question from '@/models/Question';
import mongoose from 'mongoose';

// The params argument should not be a Promise. It should be an object with params: { id: string }.
// See: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id } = params;
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    const question = await Question.findById(id);
    if (!question) return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    if (!user.follows.some((qid: mongoose.Types.ObjectId) => qid.toString() === question._id.toString())) {
      user.follows.push(question._id);
      await user.save();
    }
    return NextResponse.json({ followed: true });
  } catch (error) {
    console.error('Follow question error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id } = params;
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    user.follows = user.follows.filter((qid: mongoose.Types.ObjectId) => qid.toString() !== id);
    await user.save();
    return NextResponse.json({ followed: false });
  } catch (error) {
    console.error('Unfollow question error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id } = params;
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    const followed = user.follows.some((qid: mongoose.Types.ObjectId) => qid.toString() === id);
    return NextResponse.json({ followed });
  } catch (error) {
    console.error('Check follow status error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 