import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateMtrGroup } from '@/lib/softone/client';

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mtrgroup, name, sodtype } = body;

    if (!mtrgroup || !name || !sodtype) {
      return NextResponse.json(
        { error: 'Mtrgroup, name, and sodtype are required' },
        { status: 400 }
      );
    }

    // Update mtrgroup in SoftOne
    const data = await updateMtrGroup({
      mtrgroup,
      name,
      sodtype,
    });

    if (!data.success) {
      return NextResponse.json(
        { error: data.message || 'Failed to update mtrgroup' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Mtrgroup updated successfully',
      data: data.result,
    });
  } catch (error) {
    console.error('Error updating mtrgroup:', error);
    return NextResponse.json(
      { error: 'Failed to update mtrgroup' },
      { status: 500 }
    );
  }
}
