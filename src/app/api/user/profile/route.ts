import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email })
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Type assertion to handle MongoDB lean() return type
    const userDoc = user as Record<string, unknown>;

    return NextResponse.json({
      user: {
        _id: userDoc._id?.toString(),
        name: userDoc.name,
        email: userDoc.email,
        image: userDoc.image,
        role: userDoc.role,
        reputation: userDoc.reputation,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { name, email } = await request.json();

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email.trim(),
      _id: { $ne: session.user.id } // Exclude current user
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email is already taken' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        name: name.trim(),
        email: email.trim(),
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Type assertion to handle MongoDB return type
    const userDoc = updatedUser as Record<string, unknown>;

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        _id: userDoc._id?.toString(),
        name: userDoc.name,
        email: userDoc.email,
        image: userDoc.image,
        role: userDoc.role,
        reputation: userDoc.reputation,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 