import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ADMIN DASHBOARD</h1>
        <p className="text-muted-foreground">
          Comprehensive view of all tasks, leads, site surveys, and notes
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData userId={session.user.id} />
      </Suspense>
    </div>
  );
}

async function DashboardData({ userId }: { userId: string }) {
  // Fetch all data in parallel for better performance
  const [
    allLeadTasks,
    allProjectTasks,
    allSiteSurveys,
    allLeadNotes,
    allLeads,
    leadStatusChanges,
    statistics,
  ] = await Promise.all([
    // All Lead Tasks with relations
    prisma.leadTask.findMany({
      include: {
        lead: {
          include: {
            customer: true,
          },
        },
        assignedTo: true,
        createdBy: true,
        assignees: {
          include: {
            user: true,
          },
        },
        statusChanges: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            changedByUser: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
      ],
      take: 500, // Limit for performance
    }),

    // All Project Tasks
    prisma.task.findMany({
      include: {
        project: {
          include: {
            company: true,
          },
        },
        assignee: true,
        creator: true,
      },
      orderBy: [
        { status: "asc" },
        { dueAt: "asc" },
      ],
      take: 500,
    }),

    // All Site Surveys
    prisma.siteSurvey.findMany({
      include: {
        customer: true,
        contact: true,
        assignFrom: true,
        assignTo: true,
        lead: true,
      },
      orderBy: {
        arrangedDate: "desc",
      },
      take: 500,
    }),

    // All Lead Notes
    prisma.leadNote.findMany({
      where: {
        parentId: null, // Only top-level notes
      },
      include: {
        lead: {
          include: {
            customer: true,
          },
        },
        user: true,
        replies: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
    }),

    // All Leads
    prisma.lead.findMany({
      include: {
        customer: true,
        owner: true,
        assignee: true,
        department: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 500,
    }),

    // Recent Lead Status Changes
    prisma.leadStatusChange.findMany({
      include: {
        lead: {
          include: {
            customer: true,
          },
        },
        changedByUser: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),

    // Statistics
    prisma.$transaction([
      // Total counts
      prisma.leadTask.count(),
      prisma.task.count(),
      prisma.siteSurvey.count(),
      prisma.leadNote.count({ where: { parentId: null } }),
      prisma.lead.count(),

      // User-specific counts
      prisma.leadTask.count({
        where: {
          OR: [
            { assignedToId: userId },
            { createdById: userId },
            { assignees: { some: { userId } } },
          ],
        },
      }),
      prisma.task.count({
        where: {
          OR: [
            { assigneeId: userId },
            { createdBy: userId },
          ],
        },
      }),
      prisma.siteSurvey.count({
        where: {
          OR: [
            { assignFromId: userId },
            { assignToId: userId },
          ],
        },
      }),
      prisma.leadNote.count({
        where: { userId },
      }),
      prisma.lead.count({
        where: {
          OR: [
            { ownerId: userId },
            { assigneeId: userId },
            { participants: { some: { userId } } },
          ],
        },
      }),

      // Pending tasks
      prisma.leadTask.count({
        where: {
          status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        },
      }),
      prisma.task.count({
        where: {
          status: { in: ["Todo", "In Progress"] },
        },
      }),

      // Overdue tasks
      prisma.leadTask.count({
        where: {
          dueDate: { lt: new Date() },
          status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        },
      }),
      prisma.task.count({
        where: {
          dueAt: { lt: new Date() },
          status: { in: ["Todo", "In Progress"] },
        },
      }),

      // Active leads
      prisma.lead.count({
        where: {
          status: "ACTIVE",
        },
      }),
    ]),
  ]);

  const stats = {
    total: {
      leadTasks: statistics[0],
      projectTasks: statistics[1],
      siteSurveys: statistics[2],
      leadNotes: statistics[3],
      leads: statistics[4],
    },
    userSpecific: {
      leadTasks: statistics[5],
      projectTasks: statistics[6],
      siteSurveys: statistics[7],
      leadNotes: statistics[8],
      leads: statistics[9],
    },
    pending: {
      leadTasks: statistics[10],
      projectTasks: statistics[11],
    },
    overdue: {
      leadTasks: statistics[12],
      projectTasks: statistics[13],
    },
    activeLeads: statistics[14],
  };

  // Filter user-specific items
  const userLeadTasks = allLeadTasks.filter(
    (task) =>
      task.assignedToId === userId ||
      task.createdById === userId ||
      task.assignees.some((a) => a.userId === userId)
  );

  const userProjectTasks = allProjectTasks.filter(
    (task) => task.assigneeId === userId || task.createdBy === userId
  );

  const userSiteSurveys = allSiteSurveys.filter(
    (survey) => survey.assignFromId === userId || survey.assignToId === userId
  );

  const userLeadNotes = allLeadNotes.filter((note) => note.userId === userId);

  const userLeads = allLeads.filter(
    (lead) =>
      lead.ownerId === userId ||
      lead.assigneeId === userId ||
      (lead.participants && lead.participants.some((p) => p.userId === userId))
  );

  return (
    <AdminDashboardClient
      userId={userId}
      statistics={stats}
      allData={{
        leadTasks: allLeadTasks.map((task) => ({
          ...task,
          lead: task.lead
            ? {
                ...task.lead,
                customer: task.lead.customer || null,
              }
            : null,
          assignedTo: task.assignedTo || null,
          createdBy: task.createdBy,
          assignees: task.assignees.map((a) => ({
            ...a,
            user: a.user,
          })),
          statusChanges: task.statusChanges.map((sc) => ({
            ...sc,
            createdAt: sc.createdAt.toISOString(),
          })),
          dueDate: task.dueDate?.toISOString() || null,
          reminderDate: task.reminderDate?.toISOString() || null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        })),
        projectTasks: allProjectTasks.map((task) => ({
          ...task,
          project: {
            ...task.project,
            company: task.project.company || null,
            startAt: task.project.startAt?.toISOString() || null,
            endAt: task.project.endAt?.toISOString() || null,
            createdAt: task.project.createdAt.toISOString(),
            updatedAt: task.project.updatedAt.toISOString(),
          },
          assignee: task.assignee || null,
          creator: task.creator,
          dueAt: task.dueAt?.toISOString() || null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        })),
        siteSurveys: allSiteSurveys.map((survey) => ({
          ...survey,
          customer: survey.customer,
          contact: survey.contact || null,
          assignFrom: survey.assignFrom || null,
          assignTo: survey.assignTo || null,
          lead: survey.lead || null,
          arrangedDate: survey.arrangedDate?.toISOString() || null,
          createdAt: survey.createdAt.toISOString(),
          updatedAt: survey.updatedAt.toISOString(),
        })),
        leadNotes: allLeadNotes.map((note) => ({
          ...note,
          lead: note.lead
            ? {
                ...note.lead,
                customer: note.lead.customer || null,
                expectedCloseDate: note.lead.expectedCloseDate?.toISOString() || null,
                reviewDate: note.lead.reviewDate?.toISOString() || null,
                unfreezeReminderDate: note.lead.unfreezeReminderDate?.toISOString() || null,
                createdAt: note.lead.createdAt.toISOString(),
                updatedAt: note.lead.updatedAt.toISOString(),
              }
            : null,
          user: note.user,
          replies: note.replies.map((r) => ({
            ...r,
            user: r.user,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          })),
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        })),
        leads: allLeads.map((lead) => ({
          ...lead,
          customer: lead.customer || null,
          owner: lead.owner || null,
          assignee: lead.assignee || null,
          department: lead.department || null,
          participants: lead.participants || [],
          estimatedValue: lead.estimatedValue?.toString() || null,
          expectedCloseDate: lead.expectedCloseDate?.toISOString() || null,
          reviewDate: lead.reviewDate?.toISOString() || null,
          unfreezeReminderDate: lead.unfreezeReminderDate?.toISOString() || null,
          createdAt: lead.createdAt.toISOString(),
          updatedAt: lead.updatedAt.toISOString(),
        })),
        statusChanges: leadStatusChanges.map((sc) => ({
          ...sc,
          lead: sc.lead
            ? {
                ...sc.lead,
                customer: sc.lead.customer || null,
                estimatedValue: sc.lead.estimatedValue?.toString() || null,
                expectedCloseDate: sc.lead.expectedCloseDate?.toISOString() || null,
                reviewDate: sc.lead.reviewDate?.toISOString() || null,
                unfreezeReminderDate: sc.lead.unfreezeReminderDate?.toISOString() || null,
                createdAt: sc.lead.createdAt.toISOString(),
                updatedAt: sc.lead.updatedAt.toISOString(),
              }
            : null,
          changedByUser: sc.changedByUser,
          createdAt: sc.createdAt.toISOString(),
        })),
      }}
      userData={{
        leadTasks: userLeadTasks.map((task) => ({
          ...task,
          lead: task.lead
            ? {
                ...task.lead,
                customer: task.lead.customer || null,
              }
            : null,
          assignedTo: task.assignedTo || null,
          createdBy: task.createdBy,
          assignees: task.assignees.map((a) => ({
            ...a,
            user: a.user,
          })),
          statusChanges: task.statusChanges.map((sc) => ({
            ...sc,
            createdAt: sc.createdAt.toISOString(),
          })),
          dueDate: task.dueDate?.toISOString() || null,
          reminderDate: task.reminderDate?.toISOString() || null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        })),
        projectTasks: userProjectTasks.map((task) => ({
          ...task,
          project: {
            ...task.project,
            company: task.project.company || null,
            startAt: task.project.startAt?.toISOString() || null,
            endAt: task.project.endAt?.toISOString() || null,
            createdAt: task.project.createdAt.toISOString(),
            updatedAt: task.project.updatedAt.toISOString(),
          },
          assignee: task.assignee || null,
          creator: task.creator,
          dueAt: task.dueAt?.toISOString() || null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        })),
        siteSurveys: userSiteSurveys.map((survey) => ({
          ...survey,
          customer: survey.customer,
          contact: survey.contact || null,
          assignFrom: survey.assignFrom || null,
          assignTo: survey.assignTo || null,
          lead: survey.lead || null,
          arrangedDate: survey.arrangedDate?.toISOString() || null,
          createdAt: survey.createdAt.toISOString(),
          updatedAt: survey.updatedAt.toISOString(),
        })),
        leadNotes: userLeadNotes.map((note) => ({
          ...note,
          lead: note.lead
            ? {
                ...note.lead,
                customer: note.lead.customer || null,
                expectedCloseDate: note.lead.expectedCloseDate?.toISOString() || null,
                reviewDate: note.lead.reviewDate?.toISOString() || null,
                unfreezeReminderDate: note.lead.unfreezeReminderDate?.toISOString() || null,
                createdAt: note.lead.createdAt.toISOString(),
                updatedAt: note.lead.updatedAt.toISOString(),
              }
            : null,
          user: note.user,
          replies: note.replies.map((r) => ({
            ...r,
            user: r.user,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          })),
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        })),
        leads: userLeads.map((lead) => ({
          ...lead,
          customer: lead.customer || null,
          owner: lead.owner || null,
          assignee: lead.assignee || null,
          department: lead.department || null,
          participants: lead.participants || [],
          estimatedValue: lead.estimatedValue?.toString() || null,
          expectedCloseDate: lead.expectedCloseDate?.toISOString() || null,
          reviewDate: lead.reviewDate?.toISOString() || null,
          unfreezeReminderDate: lead.unfreezeReminderDate?.toISOString() || null,
          createdAt: lead.createdAt.toISOString(),
          updatedAt: lead.updatedAt.toISOString(),
        })),
      }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}

