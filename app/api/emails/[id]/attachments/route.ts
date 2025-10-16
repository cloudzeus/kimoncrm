import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createEmailService } from '@/lib/email/unified-service';
import { EmailProvider, EmailError } from '@/lib/email/types';
import { z } from 'zod';

const getAttachmentsSchema = z.object({
  provider: z.enum(['microsoft', 'google']),
  accessToken: z.string().min(1),
});

/**
 * GET /api/emails/[id]/attachments - Get email attachments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const query = {
      provider: searchParams.get('provider') as 'microsoft' | 'google',
      accessToken: searchParams.get('accessToken') || '',
    };

    const validatedQuery = getAttachmentsSchema.parse(query);

    const emailProvider: EmailProvider = {
      type: validatedQuery.provider,
      accessToken: validatedQuery.accessToken,
    };

    const emailService = await createEmailService(emailProvider);
    const attachments = await emailService.getMessageAttachments(id);

    return NextResponse.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error('Error fetching email attachments:', error);
    
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
      { error: 'Failed to fetch email attachments' },
      { status: 500 }
    );
  }
}
