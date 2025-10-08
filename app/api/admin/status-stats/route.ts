import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get lead statistics
    const leadStats = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const leadsByStatus = leadStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    const totalLeads = leadStats.reduce((sum, stat) => sum + stat._count.status, 0);

    // Get opportunity statistics
    const opportunityStats = await prisma.opportunity.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const opportunitiesByStatus = opportunityStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    const totalOpportunities = opportunityStats.reduce((sum, stat) => sum + stat._count.status, 0);

    // Get RFP statistics
    const rfpStats = await prisma.rFP.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const rfpsByStatus = rfpStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    const totalRfps = rfpStats.reduce((sum, stat) => sum + stat._count.status, 0);

    // Get quote statistics
    const quoteStats = await prisma.quote.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const quotesByStatus = quoteStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    const totalQuotes = quoteStats.reduce((sum, stat) => sum + stat._count.status, 0);

    return NextResponse.json({
      leads: {
        total: totalLeads,
        byStatus: leadsByStatus,
      },
      opportunities: {
        total: totalOpportunities,
        byStatus: opportunitiesByStatus,
      },
      rfps: {
        total: totalRfps,
        byStatus: rfpsByStatus,
      },
      quotes: {
        total: totalQuotes,
        byStatus: quotesByStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching status statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status statistics' },
      { status: 500 }
    );
  }
}

