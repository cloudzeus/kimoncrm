import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch lead with all related people
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        leadContacts: {
          include: {
            linkedContact: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        department: {
          include: {
            manager: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Collect all unique recipients
    const recipientsMap = new Map();

    // Add owner
    if (lead.owner && lead.owner.email) {
      recipientsMap.set(lead.owner.id, {
        id: lead.owner.id,
        name: lead.owner.name,
        email: lead.owner.email,
        role: "owner" as const,
        checked: false,
      });
    }

    // Add assignee
    if (lead.assignee && lead.assignee.email) {
      recipientsMap.set(lead.assignee.id, {
        id: lead.assignee.id,
        name: lead.assignee.name,
        email: lead.assignee.email,
        role: "assignee" as const,
        checked: false,
      });
    }

    // Add participants
    for (const participant of lead.participants) {
      if (participant.user && participant.user.email) {
        recipientsMap.set(participant.user.id, {
          id: participant.user.id,
          name: participant.user.name,
          email: participant.user.email,
          role: "participant" as const,
          checked: false,
        });
      }
    }

    // Add lead contacts
    for (const leadContact of lead.leadContacts) {
      if (leadContact.email) {
        recipientsMap.set(`contact-${leadContact.id}`, {
          id: `contact-${leadContact.id}`,
          name: leadContact.name,
          email: leadContact.email,
          role: "contact" as const,
          checked: false,
        });
      }
      // Also add linked contact if exists
      if (leadContact.linkedContact && leadContact.linkedContact.email) {
        recipientsMap.set(`linked-contact-${leadContact.linkedContact.id}`, {
          id: `linked-contact-${leadContact.linkedContact.id}`,
          name: leadContact.linkedContact.name,
          email: leadContact.linkedContact.email,
          role: "contact" as const,
          checked: false,
        });
      }
    }

    // Add department manager
    if (lead.department?.manager && lead.department.manager.email) {
      recipientsMap.set(lead.department.manager.id, {
        id: lead.department.manager.id,
        name: lead.department.manager.name,
        email: lead.department.manager.email,
        role: "manager" as const,
        checked: false,
      });
    }

    // Fetch all admins
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        isActive: true,
      },
      select: { id: true, name: true, email: true },
    });

    for (const admin of admins) {
      if (admin.email) {
        recipientsMap.set(admin.id, {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: "admin" as const,
          checked: false,
        });
      }
    }

    // Fetch all managers (users with MANAGER role or department managers)
    const managers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "MANAGER" },
          { managedDepts: { some: {} } },
        ],
        isActive: true,
      },
      select: { id: true, name: true, email: true },
    });

    for (const manager of managers) {
      if (manager.email && !recipientsMap.has(manager.id)) {
        recipientsMap.set(manager.id, {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          role: "manager" as const,
          checked: false,
        });
      }
    }

    // Fetch department employees if lead has a department
    if (lead.departmentId) {
      const employees = await prisma.user.findMany({
        where: {
          departmentId: lead.departmentId,
          isActive: true,
        },
        select: { id: true, name: true, email: true },
      });

      for (const employee of employees) {
        if (employee.email && !recipientsMap.has(employee.id)) {
          recipientsMap.set(employee.id, {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: "employee" as const,
            checked: false,
          });
        }
      }
    }

    const recipients = Array.from(recipientsMap.values());

    return NextResponse.json({
      recipients,
      leadTitle: lead.title,
    });
  } catch (error) {
    console.error("Error fetching email recipients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

