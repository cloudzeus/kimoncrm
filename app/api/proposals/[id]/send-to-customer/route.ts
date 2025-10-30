import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { sendEmailAsUser } from '@/lib/microsoft/app-auth';

/**
 * POST /api/proposals/[id]/send-to-customer
 * Send proposal document to customer via email
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: proposalId } = await params;
    const body = await req.json();
    const { 
      recipientEmails, // Array of email addresses
      subject,
      message,
      includeWordDoc = true,
      includePdf = false,
    } = body;

    if (!recipientEmails || recipientEmails.length === 0) {
      return Response.json(
        { error: 'At least one recipient email is required' },
        { status: 400 }
      );
    }

    // Fetch proposal with all related data
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        customer: true,
        contact: true,
        lead: true,
        generatedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Check if document exists
    if (!proposal.wordDocumentUrl && !proposal.pdfDocumentUrl) {
      return Response.json(
        { error: 'No document available. Please generate a document first.' },
        { status: 400 }
      );
    }

    // Get company details and user info
    const companyDetails = await prisma.defaultCompanyData.findFirst();
    
    if (!companyDetails || !companyDetails.email) {
      return Response.json(
        { error: 'Company email not configured' },
        { status: 500 }
      );
    }

    // Get sender email (from session user or company)
    const senderEmail = session.user.email || companyDetails.email;
    
    if (!senderEmail) {
      return Response.json(
        { error: 'Sender email not found' },
        { status: 500 }
      );
    }

    // Prepare email content
    const defaultSubject = `ΠΡΟΤΑΣΗ: ${proposal.projectTitle || 'Τεχνική Πρόταση'}`;
    const defaultMessage = `
<p>Αγαπητέ/ή <strong>${proposal.customer.name}</strong>,</p>

<p>Σας αποστέλλουμε την τεχνική πρόταση για το έργο "<strong>${proposal.projectTitle}</strong>".</p>

${proposal.projectDescription ? `<p>${proposal.projectDescription}</p>` : ''}

${proposal.erpQuoteNumber ? `<p><strong>Αριθμός Προσφοράς ERP:</strong> ${proposal.erpQuoteNumber}</p>` : ''}

${includeWordDoc && proposal.wordDocumentUrl ? '<p>Η πρόταση σε μορφή Word Document επισυνάπτεται.</p>' : ''}
${includePdf && proposal.pdfDocumentUrl ? '<p>Η πρόταση σε μορφή PDF επισυνάπτεται.</p>' : ''}

<p>Παρακαλούμε εξετάστε την πρόταση και επικοινωνήστε μαζί μας για οποιαδήποτε διευκρίνιση.</p>

<p>Με εκτίμηση,<br/>
${proposal.generatedByUser?.name || companyDetails.companyName}<br/>
${companyDetails.phone1 ? `Τηλ: ${companyDetails.phone1}<br/>` : ''}
${companyDetails.email ? `Email: ${companyDetails.email}` : ''}
</p>
    `.trim();

    // Note: Microsoft Graph API doesn't support direct file URL attachments
    // Attachments need to be downloaded and sent as base64
    // For now, we'll send email without attachments and include document links instead
    
    // Send email using Microsoft Graph API
    try {
      await sendEmailAsUser(
        senderEmail,
        subject || defaultSubject,
        message || defaultMessage,
        recipientEmails,
        ccRecipients && ccRecipients.length > 0 ? ccRecipients : undefined
      );
    } catch (emailError) {
      console.error('Error sending email via Microsoft Graph:', emailError);
      return Response.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    // Update proposal with email tracking
    const existingSentEmails = proposal.sentToEmails 
      ? JSON.parse(proposal.sentToEmails) 
      : [];
    
    const updatedSentEmails = Array.from(new Set([...existingSentEmails, ...recipientEmails]));

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'SENT',
        lastSentDate: new Date(),
        sentCount: proposal.sentCount + 1,
        sentToEmails: JSON.stringify(updatedSentEmails),
        submittedDate: proposal.submittedDate || new Date(),
      },
      include: {
        customer: true,
        contact: true,
        lead: true,
      },
    });

    return Response.json({
      success: true,
      proposal: updatedProposal,
      sentTo: recipientEmails,
      message: `Η πρόταση στάλθηκε επιτυχώς σε ${recipientEmails.length} παραλήπτες`,
    });
  } catch (error: any) {
    console.error('Error sending proposal to customer:', error);
    
    return Response.json(
      { 
        error: error.message || 'Failed to send proposal to customer',
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}

