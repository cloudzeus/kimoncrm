import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// DELETE /api/leads/[id]/notes/[noteId] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;

    // Check if note exists and user has permission to delete it
    const note = await prisma.leadNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Only allow deletion if user is the author or has admin/manager role
    if (note.userId !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
        return NextResponse.json(
          { error: 'Forbidden: You can only delete your own notes' },
          { status: 403 }
        );
      }
    }

    // Delete the note (cascade will handle replies and attachments)
    await prisma.leadNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}

