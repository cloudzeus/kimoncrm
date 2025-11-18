'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * Server Action: Save column visibility preferences for a table
 */
export async function saveColumnVisibilityPreferences(
  tableName: string,
  columnVisibility: Record<string, boolean>
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.userPreference.upsert({
      where: {
        userId_tableName_key: {
          userId: session.user.id,
          tableName,
          key: 'columnVisibility',
        },
      },
      update: {
        value: columnVisibility,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        tableName,
        key: 'columnVisibility',
        value: columnVisibility,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving column visibility preferences:', error);
    return { success: false, error: 'Failed to save preferences' };
  }
}

/**
 * Server Action: Load column visibility preferences for a table
 */
export async function loadColumnVisibilityPreferences(
  tableName: string
): Promise<Record<string, boolean> | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    const preference = await prisma.userPreference.findUnique({
      where: {
        userId_tableName_key: {
          userId: session.user.id,
          tableName,
          key: 'columnVisibility',
        },
      },
    });

    if (preference?.value && typeof preference.value === 'object') {
      return preference.value as Record<string, boolean>;
    }

    return null;
  } catch (error) {
    console.error('Error loading column visibility preferences:', error);
    return null;
  }
}

/**
 * Server Action: Save column widths preferences for a table
 */
export async function saveColumnWidthsPreferences(
  tableName: string,
  columnWidths: Record<string, number>
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.userPreference.upsert({
      where: {
        userId_tableName_key: {
          userId: session.user.id,
          tableName,
          key: 'columnWidths',
        },
      },
      update: {
        value: columnWidths,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        tableName,
        key: 'columnWidths',
        value: columnWidths,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving column widths preferences:', error);
    return { success: false, error: 'Failed to save preferences' };
  }
}

/**
 * Server Action: Load column widths preferences for a table
 */
export async function loadColumnWidthsPreferences(
  tableName: string
): Promise<Record<string, number> | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    const preference = await prisma.userPreference.findUnique({
      where: {
        userId_tableName_key: {
          userId: session.user.id,
          tableName,
          key: 'columnWidths',
        },
      },
    });

    if (preference?.value && typeof preference.value === 'object') {
      return preference.value as Record<string, number>;
    }

    return null;
  } catch (error) {
    console.error('Error loading column widths preferences:', error);
    return null;
  }
}



