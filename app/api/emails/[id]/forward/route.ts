import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createEmailService } from '@/lib/email/unified-service';
import { EmailProvider, EmailError } from '@/lib/email/types';
import { z } from 'zod';

const forwardEmailSchema = z.object({
  provider: z.enum(['microsoft', 'google']),
  accessToken: z.string().min(1),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  content: z.string().optional(),
});

/**
 * POST /api/emails/[id]/forward - Forward email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    const validatedBody = forwardEmailSchema.parse(body);

    const emailProvider: EmailProvider = {
      type: validatedBody.provider,
      accessToken: validatedBody.accessToken,
    };

    const emailService = await createEmailService(emailProvider);
    
    const messageId = await emailService.forwardEmail(
      id,
      validatedBody.to,
      validatedBody.content
    );

    return NextResponse.json({
      success: true,
      data: { messageId },
      message: 'Email forwarded successfully',
    });
  } catch (error) {
    console.error('Error forwarding email:', error);
    
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
      { error: 'Failed to forward email' },
      { status: 500 }
    );
  }
}
