import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Answer, { IAnswer } from '@/models/Answer';
import { generateELI5 } from '@/lib/gemini';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const answer = await Answer.findById(id).lean() as IAnswer | null;

    if (!answer) {
      return NextResponse.json(
        { message: 'Answer not found' },
        { status: 404 }
      );
    }

    // Generate ELI5 explanation
    const eli5Explanation = await generateELI5(answer.content);

    return NextResponse.json({
      eli5: eli5Explanation,
    });
  } catch (error) {
    console.error('Error generating ELI5:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;
    
    // Check if answer exists
    const answer = await Answer.findById(id);
    if (!answer) {
      return NextResponse.json(
        { message: 'Answer not found' },
        { status: 404 }
      );
    }

    // Generate ELI5 content
    const eli5Content = await generateELI5(answer.content);

    // Update answer with ELI5 content
    const updatedAnswer = await Answer.findByIdAndUpdate(
      id,
      { eli5Content },
      { new: true }
    ).populate('author', 'name email image');

    return NextResponse.json({
      message: 'ELI5 content generated successfully',
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error('Error generating ELI5:', error);
    return NextResponse.json(
      { message: 'Failed to generate ELI5 content' },
      { status: 500 }
    );
  }
} 