import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'SENT', 'ACCEPTED', 'REVISED', 'REJECTED', 'WON', 'LOST', 'EXPIRED']),
  note: z.string().optional(),
  // Project creation fields (only when status is ACCEPTED or WON)
  projectManagerId: z.string().optional(),
  departmentId: z.string().optional(),
  projectStartDate: z.string().optional(),
  projectEndDate: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: proposalId } = await params;

    // Verify proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        lead: true,
        siteSurvey: true,
        customer: true,
        contact: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, note, projectManagerId, departmentId, projectStartDate, projectEndDate } = updateStatusSchema.parse(body);

    // Don't update if status hasn't changed
    if (proposal.status === status) {
      return NextResponse.json(proposal);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update proposal status
      const updatedProposal = await tx.proposal.update({
        where: { id: proposalId },
        data: {
          status,
          approvedDate: status === 'ACCEPTED' || status === 'WON' ? new Date() : proposal.approvedDate,
          rejectedDate: status === 'REJECTED' || status === 'LOST' ? new Date() : proposal.rejectedDate,
          wonDate: status === 'WON' ? new Date() : proposal.wonDate,
          notes: note ? `${proposal.notes || ''}\n\n[${new Date().toISOString()}] Status changed to ${status}${note ? ': ' + note : ''}` : proposal.notes,
        },
        include: {
          lead: true,
          siteSurvey: true,
          customer: true,
          contact: true,
        },
      });

      // If proposal is ACCEPTED or WON and there's a linked lead, convert lead to WON and create project
      if ((status === 'ACCEPTED' || status === 'WON') && proposal.leadId) {
        const lead = await tx.lead.findUnique({
          where: { id: proposal.leadId },
          include: {
            customer: true,
            assignee: true,
          },
        });

        if (lead) {
          // Update lead status to WON
          await tx.lead.update({
            where: { id: proposal.leadId },
            data: {
              status: 'CLOSED',
              stage: 'OPP_CLOSED_WON',
            },
          });

          // Record lead status change
          await tx.leadStatusChange.create({
            data: {
              leadId: proposal.leadId,
              fromStatus: lead.status,
              toStatus: 'CLOSED',
              changedBy: session.user.id,
              note: `Lead won - Proposal ${proposal.proposalNo || proposalId} accepted by customer`,
            },
          });

          // Create project from lead
          const project = await tx.project.create({
            data: {
              leadId: proposal.leadId,
              name: proposal.projectTitle || lead.title,
              description: proposal.projectDescription || `Project from proposal ${proposal.proposalNo || proposalId}`,
              startAt: projectStartDate ? new Date(projectStartDate) : proposal.projectStartDate,
              endAt: projectEndDate ? new Date(projectEndDate) : proposal.projectEndDate,
              status: 'Active',
              contactId: proposal.contactId || lead.contactId,
            },
          });

          // Assign users to project
          const assignees = [];
          
          // Add project manager if specified
          if (projectManagerId) {
            assignees.push({
              projectId: project.id,
              userId: projectManagerId,
              role: 'Project Manager',
            });
          }

          // Add lead assignee as team member if exists and not already added as PM
          if (lead.assigneeId && lead.assigneeId !== projectManagerId) {
            assignees.push({
              projectId: project.id,
              userId: lead.assigneeId,
              role: 'Member',
            });
          }

          // Add current user if not already added
          if (session.user.id !== projectManagerId && session.user.id !== lead.assigneeId) {
            assignees.push({
              projectId: project.id,
              userId: session.user.id,
              role: 'Member',
            });
          }

          // Create project assignments
          if (assignees.length > 0) {
            await Promise.all(
              assignees.map((assignee) =>
                tx.projectAssignment.create({ data: assignee })
              )
            );
          }

          return {
            ...updatedProposal,
            project,
            leadConverted: true,
          };
        }
      }

      return updatedProposal;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating proposal status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update proposal status' },
      { status: 500 }
    );
  }
}

