import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

/**
 * POST /api/admin/users/import - Bulk import users (admin only)
 * Body: { users: Array<{ email: string; name?: string | null; role?: UserRole }> }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { users } = body || {};

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'users array is required' }, { status: 400 });
    }

    // Normalize payload
    const toCreate = users
      .map((u: any) => ({
        email: typeof u.email === 'string' ? u.email.trim().toLowerCase() : null,
        name: typeof u.name === 'string' ? u.name : null,
        role: (u.role as UserRole) || UserRole.EMPLOYEE,
      }))
      .filter((u: any) => !!u.email);

    if (toCreate.length === 0) {
      return NextResponse.json({ error: 'No valid users to import' }, { status: 400 });
    }

    // De-duplicate by email
    const dedupMap = new Map<string, { email: string; name: string | null; role: UserRole }>();
    for (const u of toCreate) {
      dedupMap.set(u.email, u);
    }
    const deduped = Array.from(dedupMap.values());

    // Check existing users
    const existing = await prisma.user.findMany({
      where: { email: { in: deduped.map((u) => u.email) } },
      select: { email: true },
    });
    const existingEmails = new Set(existing.map((e) => e.email));

    const createData = deduped.filter((u) => !existingEmails.has(u.email));

    // Bulk create
    const created = await prisma.user.createMany({
      data: createData.map((u) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: true,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      createdCount: created.count,
      skippedExisting: existingEmails.size,
    });
  } catch (error) {
    console.error('Error importing users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


