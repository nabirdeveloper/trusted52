import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/connect';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const admin = await User.findOne({ 
      email: session.user.email,
      role: 'admin' 
    }).select('-password');

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, avatar } = await request.json();

    // Basic validation
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await dbConnect();

    const updateData: any = {
      name: name.trim(),
      phone: phone?.trim() || undefined,
    };

    // Only update avatar if provided
    if (avatar) {
      updateData.avatar = avatar;
    }

    const updatedAdmin = await User.findOneAndUpdate(
      { email: session.user.email, role: 'admin' },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Update the session with new avatar if it was changed
    if (avatar) {
      // Note: In a real implementation, you might need to refresh the session
      // For now, the user will need to re-login to see the avatar in header
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedAdmin
    });
  } catch (error: any) {
    console.error('Error updating admin profile:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}