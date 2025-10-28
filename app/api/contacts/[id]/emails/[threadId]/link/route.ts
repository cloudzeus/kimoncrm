import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    console.log("=== LINK EMAIL API CALLED ===");
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, threadId } = await params;
    console.log("Contact ID:", id);
    console.log("Thread ID:", threadId);
    const body = await request.json();
    const { customerId, projectId, supplierId } = body;
    console.log("Body:", { customerId, projectId, supplierId });

    if (!customerId && !projectId && !supplierId) {
      return NextResponse.json(
        { error: "Either customerId, projectId, or supplierId is required" },
        { status: 400 }
      );
    }

    // Check if the thread exists by id or externalId
    const existingThread = await prisma.emailThread.findFirst({
      where: {
        OR: [
          { id: threadId },
          { externalId: threadId }
        ]
      },
    });

    // If thread doesn't exist, create a minimal record to store the association
    if (!existingThread) {
      console.log("Thread not found, creating minimal record for association");
      
      const threadData: any = {
        externalId: threadId,
        provider: 'MICROSOFT',
        contactId: id,
        messageCount: 0,
      };
      
      // Handle customerId - check if it's Customer or Company
      if (customerId) {
        // First check if it's a Customer ID
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
        });
        
        if (customer) {
          threadData.customerId = customerId;
        } else {
          // Check if it's a Company ID
          const companyExists = await prisma.company.findUnique({
            where: { id: customerId },
          });
          if (companyExists) {
            threadData.companyId = customerId;
          } else {
            return NextResponse.json(
              { error: `Customer/Company with ID ${customerId} not found` },
              { status: 404 }
            );
          }
        }
      }
      
      // Handle supplierId
      if (supplierId) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: supplierId },
        });
        if (!supplier) {
          return NextResponse.json(
            { error: `Supplier with ID ${supplierId} not found` },
            { status: 404 }
          );
        }
        threadData.supplierId = supplierId;
      }
      
      // Handle projectId
      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        });
        if (!project) {
          return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
          );
        }
        threadData.projectId = projectId;
      }
      
      const newThread = await prisma.emailThread.create({
        data: threadData,
      });
      
      return NextResponse.json({
        success: true,
        data: newThread,
        message: "Email association created",
      });
    }

    // Update the email thread with the association(s)
    const updateData: any = {};
    
    // Handle customerId - check if it's Customer or Company
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (customer) {
        updateData.customerId = customerId;
      } else {
        const company = await prisma.company.findUnique({
          where: { id: customerId },
        });
        if (company) {
          updateData.companyId = customerId;
        }
      }
    }
    
    if (supplierId) {
      updateData.supplierId = supplierId;
    }
    
    if (projectId) {
      updateData.projectId = projectId;
    }
    
    const updatedThread = await prisma.emailThread.update({
      where: { id: existingThread.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedThread,
    });
  } catch (error: any) {
    console.error("Error linking email:", error);
    return NextResponse.json(
      { error: "Failed to link email", details: error.message },
      { status: 500 }
    );
  }
}

