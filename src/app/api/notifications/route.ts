import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User, { IUser } from '@/models/User';
import mongoose from 'mongoose';
import Notification from '@/models/Notification';

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const filter = searchParams.get('filter') || 'all';
    const skip = (page - 1) * limit;

    // Build query for notifications
    const query: any = { recipient: user._id };
    if (filter !== 'all') {
      if (filter === 'unread') {
        query.isRead = false;
      } else {
        query.type = filter;
      }
    }

    // Fetch notifications with pagination
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedQuestion', 'title')
        .populate('relatedAnswer', 'content'),
      Notification.countDocuments(query)
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      message: total === 0 ? 'No notifications here for you' : undefined,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { 
      type, 
      title, 
      message, 
      recipientId, 
      relatedQuestion, 
      relatedAnswer 
    } = await request.json();

    // Validate input
    if (!type || !title || !message || !recipientId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create notification
    const newNotification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedQuestion,
      relatedAnswer,
      isRead: false,
    });

    return NextResponse.json({
      message: 'Notification created successfully',
      notification: newNotification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { message: 'Invalid notification IDs' },
        { status: 400 }
      );
    }

    // Mark specified notifications as read
    await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        recipient: user._id 
      },
      { isRead: true }
    );

    return NextResponse.json({
      message: 'Notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 