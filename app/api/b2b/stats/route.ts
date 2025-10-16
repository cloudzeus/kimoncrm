import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'B2B') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Verify user has access to this company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { contact: true },
    });

    if (!user?.contact?.companyId || user.contact.companyId !== companyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch stats in parallel
    const [
      quotesStats,
      quotesGrouped,
      ordersStats,
      ordersGrouped,
      ticketsStats,
      ticketsGrouped,
      projectsStats,
      projectsGrouped,
    ] = await Promise.all([
      // Quotes stats
      prisma.quote.aggregate({
        where: { companyId },
        _count: { id: true },
      }),
      prisma.quote.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true },
      }),
      
      // Orders stats
      prisma.order.aggregate({
        where: { companyId },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true },
      }),
      
      // Tickets stats
      prisma.ticket.aggregate({
        where: { companyId },
        _count: { id: true },
      }),
      prisma.ticket.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true },
      }),
      
      // Projects stats
      prisma.project.aggregate({
        where: { companyId },
        _count: { id: true },
      }),
      prisma.project.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true },
      }),
    ]);

    // Process quotes stats
    const quotes = {
      total: quotesStats._count.id,
      pending: quotesGrouped.find(q => q.status === 'Pending')?._count.id || 0,
      approved: quotesGrouped.find(q => q.status === 'Approved')?._count.id || 0,
      expired: quotesGrouped.find(q => q.status === 'Expired')?._count.id || 0,
    };

    // Process orders stats
    const orders = {
      total: ordersStats._count.id,
      pending: ordersGrouped.find(o => o.status === 'Pending')?._count.id || 0,
      processing: ordersGrouped.find(o => o.status === 'Processing')?._count.id || 0,
      completed: ordersGrouped.find(o => o.status === 'Completed')?._count.id || 0,
      totalValue: ordersStats._sum.total || 0,
    };

    // Process tickets stats
    const tickets = {
      total: ticketsStats._count.id,
      open: ticketsGrouped.find(t => t.status === 'New' || t.status === 'Open')?._count.id || 0,
      inProgress: ticketsGrouped.find(t => t.status === 'In Progress')?._count.id || 0,
      resolved: ticketsGrouped.find(t => t.status === 'Resolved')?._count.id || 0,
      avgResolutionTime: 24, // TODO: Calculate actual average resolution time
    };

    // Process projects stats
    const projects = {
      total: projectsStats._count.id,
      active: projectsGrouped.find(p => p.status === 'Active')?._count.id || 0,
      completed: projectsGrouped.find(p => p.status === 'Completed')?._count.id || 0,
      onHold: projectsGrouped.find(p => p.status === 'On Hold')?._count.id || 0,
    };

    return NextResponse.json({
      quotes,
      orders,
      tickets,
      projects,
    });
  } catch (error) {
    console.error('Error fetching B2B stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
