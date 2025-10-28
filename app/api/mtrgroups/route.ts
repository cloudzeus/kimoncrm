import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMtrGroup } from '@/lib/softone/client';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get sodtype from query params (default to 51 for products)
    const searchParams = request.nextUrl.searchParams;
    const sodtype = parseInt(searchParams.get('sodtype') || '51', 10);

    // Fetch mtrgroups from SoftOne
    const data = await getMtrGroup(sodtype);

    if (!data.success) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch mtrgroups' },
        { status: 400 }
      );
    }

    // Transform the data to a more user-friendly format
    const groups = (data.result || []).map((group: any) => ({
      mtrgroup: group.MTRGROUP,
      code: group.CODE,
      name: group.NAME,
      sodtype: group.SODTYPE,
      isactive: group.ISACTIVE === '1',
    }));

    return NextResponse.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Error fetching mtrgroups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mtrgroups' },
      { status: 500 }
    );
  }
}
