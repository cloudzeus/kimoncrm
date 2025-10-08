import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createEmailService } from '@/lib/email/unified-service';
import { EmailProvider, EmailError } from '@/lib/email/types';
import { z } from 'zod';

const replyEmailSchema = z.object({
  provider: z.enum(['microsoft', 'google']),
  accessToken: z.string().min(1),
  content: z.string().min(1),
  replyAll: z.boolean().optional().default(false),
});

/**
 * POST /api/emails/[id]/reply - Reply to email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    const validatedBody = replyEmailSchema.parse(body);

    const emailProvider: EmailProvider = {
      type: validatedBody.provider,
      accessToken: validatedBody.accessToken,
    };

    const emailService = await createEmailService(emailProvider);
    
    const messageId = await emailService.replyToEmail(
      params.id,
      validatedBody.content,
      validatedBody.replyAll
    );

    return NextResponse.json({
      success: true,
      data: { messageId },
      message: 'Reply sent successfully',
    });
  } catch (error) {
    console.error('Error replying to email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
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
      { error: 'Failed to reply to email' },
      { status: 500 }
    );
  }
}
