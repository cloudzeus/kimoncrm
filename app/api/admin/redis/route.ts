import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { 
  getRedisDatabaseInfo, 
  clearRedisDatabase, 
  redisHealthCheck,
  RedisDatabases 
} from '@/lib/redis/utils';

/**
 * GET /api/admin/redis - Get Redis database information and health
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    
    const health = await redisHealthCheck();
    const info = await getRedisDatabaseInfo();
    
    return NextResponse.json({
      success: true,
      data: {
        health,
        info,
        databases: RedisDatabases,
      },
    });
  } catch (error) {
    console.error('Error fetching Redis info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Redis information' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/redis/[database] - Clear specific Redis database
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database');
    
    if (!database) {
      return NextResponse.json(
        { error: 'Database parameter is required' },
        { status: 400 }
      );
    }
    
    const validDatabases = ['sessions', 'cache', 'rateLimit', 'emailCache'];
    if (!validDatabases.includes(database)) {
      return NextResponse.json(
        { error: 'Invalid database name' },
        { status: 400 }
      );
    }
    
    const success = await clearRedisDatabase(database as keyof typeof RedisDatabases);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Redis database '${database}' cleared successfully`,
      });
    } else {
      return NextResponse.json(
        { error: `Failed to clear Redis database '${database}'` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error clearing Redis database:', error);
    return NextResponse.json(
      { error: 'Failed to clear Redis database' },
      { status: 500 }
    );
  }
}
