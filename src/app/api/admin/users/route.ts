import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// GET - Fetch all users (admin only)
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

    // Only admins can view all users
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest';
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (filter === 'banned') {
      query.isBanned = true;
    } else if (filter === 'active') {
      query.isBanned = false;
    } else if (filter === 'admin') {
      query.role = 'admin';
    } else if (filter === 'user') {
      query.role = 'user';
    }

    // Build sort object
    let sortObject: any = {};
    switch (sort) {
      case 'name':
        sortObject = { name: 1 };
        break;
      case 'email':
        sortObject = { email: 1 };
        break;
      case 'reputation':
        sortObject = { reputation: -1 };
        break;
      case 'oldest':
        sortObject = { createdAt: 1 };
        break;
      default:
        sortObject = { createdAt: -1 };
    }

    // Execute query
    const users = await User.find(query)
      .populate('bannedBy', 'name email')
      .select('-password')
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await User.countDocuments(query);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Ban/Unban user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Only admins can ban/unban users
    if (adminUser.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { userId, action, reason } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { message: 'User ID and action are required' },
        { status: 400 }
      );
    }

    if (!['ban', 'unban'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Use "ban" or "unban"' },
        { status: 400 }
      );
    }

    if (action === 'ban' && !reason) {
      return NextResponse.json(
        { message: 'Ban reason is required' },
        { status: 400 }
      );
    }

    // Find the user to ban/unban
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent admin from banning themselves
    if (targetUser._id.toString() === adminUser._id.toString()) {
      return NextResponse.json(
        { message: 'You cannot ban yourself' },
        { status: 400 }
      );
    }

    // Prevent banning other admins
    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { message: 'Cannot ban admin users' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    if (action === 'ban') {
      updateData = {
        isBanned: true,
        bannedAt: new Date(),
        banReason: reason,
        bannedBy: adminUser._id,
      };
    } else {
      updateData = {
        isBanned: false,
        $unset: { bannedAt: 1, banReason: 1, bannedBy: 1 },
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    return NextResponse.json({
      message: `User ${action === 'ban' ? 'banned' : 'unbanned'} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error managing user ban status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 