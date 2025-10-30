import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rfpId } = await params;
    const body = await request.json();
    const { products, services } = body;

    // Fetch existing RFP
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
    });

    if (!rfp) {
      return Response.json({ success: false, error: 'RFP not found' }, { status: 404 });
    }

    // Parse existing requirements
    const existingRequirements = rfp.requirements ? (typeof rfp.requirements === 'string' ? JSON.parse(rfp.requirements) : rfp.requirements) : {};

    // Update products and services with new pricing
    const updatedRequirements = {
      ...existingRequirements,
      products: products || existingRequirements.products || [],
      services: services || existingRequirements.services || [],
    };

    // Calculate new total
    const productsTotal = (products || []).reduce((sum: number, p: any) => {
      const subtotal = p.quantity * p.price;
      const margin = p.margin || 0;
      return sum + subtotal + (subtotal * margin / 100);
    }, 0);

    const servicesTotal = (services || []).reduce((sum: number, s: any) => {
      const subtotal = s.quantity * s.price;
      const margin = s.margin || 0;
      return sum + subtotal + (subtotal * margin / 100);
    }, 0);

    const totalAmount = productsTotal + servicesTotal;

    // Update RFP
    const updatedRFP = await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        requirements: JSON.stringify(updatedRequirements),
        totalAmount,
        updatedAt: new Date(),
      },
      include: {
        customer: true,
        lead: true,
        siteSurvey: true,
      },
    });

    return Response.json({
      success: true,
      rfp: {
        ...updatedRFP,
        totalAmount: Number(updatedRFP.totalAmount),
      },
    });
  } catch (error) {
    console.error('Error updating RFP pricing:', error);
    return Response.json(
      { success: false, error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}

