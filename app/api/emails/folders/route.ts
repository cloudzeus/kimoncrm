import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createEmailService } from '@/lib/email/unified-service';
import { EmailProvider, EmailError } from '@/lib/email/types';
import { z } from 'zod';

const getFoldersSchema = z.object({
  provider: z.enum(['microsoft', 'google']),
  accessToken: z.string().min(1),
});

/**
 * GET /api/emails/folders - Get email folders/labels
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const query = {
      provider: searchParams.get('provider') as 'microsoft' | 'google',
      accessToken: searchParams.get('accessToken') || '',
    };

    const validatedQuery = getFoldersSchema.parse(query);

    const emailProvider: EmailProvider = {
      type: validatedQuery.provider,
      accessToken: validatedQuery.accessToken,
    };

    const emailService = await createEmailService(emailProvider);
    const folders = await emailService.getFolders();

    return NextResponse.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    console.error('Error fetching email folders:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof EmailError) {
      return NextResponse.json(
        { error: error.message, provider: error.provider },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch email folders' },
      { status: 500 }
    );
  }
}
