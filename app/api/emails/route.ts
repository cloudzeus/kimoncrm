import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createEmailService } from '@/lib/email/unified-service';
import { EmailProvider, EmailSearchOptions, EmailError } from '@/lib/email/types';
import { z } from 'zod';

const getEmailsSchema = z.object({
  provider: z.enum(['microsoft', 'google']),
  accessToken: z.string().min(1),
  folderId: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  query: z.string().optional(),
  isRead: z.boolean().optional(),
  hasAttachments: z.boolean().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

const sendEmailSchema = z.object({
  provider: z.enum(['microsoft', 'google']),
  accessToken: z.string().min(1),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  isHtml: z.boolean().optional().default(false),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // Base64 encoded
    mimeType: z.string(),
  })).optional(),
});

/**
 * GET /api/emails - Get emails from provider
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const query = {
      provider: searchParams.get('provider') as 'microsoft' | 'google',
      accessToken: searchParams.get('accessToken') || '',
      folderId: searchParams.get('folderId') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      query: searchParams.get('query') || undefined,
      isRead: searchParams.get('isRead') ? searchParams.get('isRead') === 'true' : undefined,
      hasAttachments: searchParams.get('hasAttachments') ? searchParams.get('hasAttachments') === 'true' : undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
    };

    const validatedQuery = getEmailsSchema.parse(query);

    const emailProvider: EmailProvider = {
      type: validatedQuery.provider,
      accessToken: validatedQuery.accessToken,
    };

    const emailService = await createEmailService(emailProvider);
    
    const searchOptions: EmailSearchOptions = {
      folderId: validatedQuery.folderId,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
      query: validatedQuery.query,
      isRead: validatedQuery.isRead,
      hasAttachments: validatedQuery.hasAttachments,
      fromDate: validatedQuery.fromDate,
      toDate: validatedQuery.toDate,
    };

    const result = await emailService.getMessages(searchOptions);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    
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
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails - Send email
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    const validatedBody = sendEmailSchema.parse(body);

    const emailProvider: EmailProvider = {
      type: validatedBody.provider,
      accessToken: validatedBody.accessToken,
    };

    const emailService = await createEmailService(emailProvider);
    
    const messageId = await emailService.sendEmail({
      to: validatedBody.to,
      cc: validatedBody.cc,
      bcc: validatedBody.bcc,
      subject: validatedBody.subject,
      body: validatedBody.body,
      isHtml: validatedBody.isHtml,
      attachments: validatedBody.attachments,
    });

    return NextResponse.json({
      success: true,
      data: { messageId },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
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
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
