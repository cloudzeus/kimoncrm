import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createEmailService } from '@/lib/email/unified-service';
import { EmailProvider, EmailAction, EmailError } from '@/lib/email/types';
import { z } from 'zod';

const emailActionSchema = z.object({
  provider: z.enum(['microsoft', 'google']),
  accessToken: z.string().min(1),
  action: z.object({
    type: z.enum(['mark_read', 'mark_unread', 'delete', 'move', 'add_label', 'remove_label']),
    folderId: z.string().optional(),
    labelIds: z.array(z.string()).optional(),
  }),
});

/**
 * POST /api/emails/[id]/actions - Perform email action (mark as read/unread, delete, move, etc.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    const validatedBody = emailActionSchema.parse(body);

    const emailProvider: EmailProvider = {
      type: validatedBody.provider,
      accessToken: validatedBody.accessToken,
    };

    const emailService = await createEmailService(emailProvider);
    
    const action: EmailAction = {
      type: validatedBody.action.type,
      messageId: params.id,
      folderId: validatedBody.action.folderId,
      labelIds: validatedBody.action.labelIds,
    };

    await emailService.performAction(action);

    return NextResponse.json({
      success: true,
      message: `Email ${action.type} action completed successfully`,
    });
  } catch (error) {
    console.error('Error performing email action:', error);
    
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
      { error: 'Failed to perform email action' },
      { status: 500 }
    );
  }
}
