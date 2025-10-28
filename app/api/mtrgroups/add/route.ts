import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addMtrGroup } from '@/lib/softone/client';

export async function POST(request: NextRequest) {
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
    const { mtrgroup, name, code, isactive, sodtype } = body;

    if (!mtrgroup || !name || !code || !sodtype) {
      return NextResponse.json(
        { error: 'Mtrgroup, name, code, and sodtype are required' },
        { status: 400 }
      );
    }

    // Add mtrgroup to SoftOne
    const data = await addMtrGroup({
      mtrgroup,
      name,
      code,
      isactive: isactive ?? 0,
      sodtype,
    });

    if (!data.success) {
      return NextResponse.json(
        { error: data.message || 'Failed to add mtrgroup' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Mtrgroup added successfully',
      data: data.result,
    });
  } catch (error) {
    console.error('Error adding mtrgroup:', error);
    return NextResponse.json(
      { error: 'Failed to add mtrgroup' },
      { status: 500 }
    );
  }
}
