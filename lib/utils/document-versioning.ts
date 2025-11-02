import prisma from '@/lib/db/prisma';
import { deleteFileFromBunny } from '@/lib/bunny/upload';

/**
 * Manages document versioning with max 10 versions
 * - Finds existing files for the same document type/entity
 * - Increments version number
 * - Deletes oldest version if more than 10 exist
 * 
 * @param entityType - Type of entity (e.g., 'site-survey', 'proposal', 'rfp')
 * @param entityId - ID of the entity
 * @param documentType - Type of document (e.g., 'bom', 'proposal-document', 'products-analysis', 'rfp')
 * @param baseFileName - Base name without version (e.g., 'BOM-ProjectName')
 * @param fileExtension - File extension (e.g., 'xlsx', 'docx')
 * @returns Object with nextVersion number and cleanedUp flag
 */
export async function manageDocumentVersions({
  entityType,
  entityId,
  documentType,
  baseFileName,
  fileExtension,
}: {
  entityType: string;
  entityId: string;
  documentType: string;
  baseFileName: string;
  fileExtension: string;
}): Promise<{ nextVersion: number; cleanedUp: boolean }> {
  console.log('📁 Managing document versions:', {
    entityType,
    entityId,
    documentType,
    baseFileName,
    fileExtension,
  });

  // Find all files of this type for this entity
  // We'll use the filename pattern to identify versions
  const filenamePattern = `${baseFileName}_v`;

  const existingFiles = await prisma.file.findMany({
    where: {
      entityType,
      entityId,
      filename: {
        contains: filenamePattern,
      },
    },
    orderBy: {
      createdAt: 'desc', // Most recent first
    },
  });

  console.log(`📄 Found ${existingFiles.length} existing versions`);

  // Extract version numbers from filenames
  const versions = existingFiles
    .map((file) => {
      const match = file.filename.match(/_v(\d+)\./);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((v) => v > 0)
    .sort((a, b) => b - a); // Sort descending

  const latestVersion = versions.length > 0 ? versions[0] : 0;
  const nextVersion = latestVersion + 1;

  console.log('🔢 Version info:', {
    latestVersion,
    nextVersion,
    totalVersions: existingFiles.length,
  });

  // If we have 10 or more versions, delete the oldest ones
  let cleanedUp = false;
  if (existingFiles.length >= 10) {
    console.log('🗑️  Max versions reached, cleaning up old versions...');

    // Keep the 9 most recent, delete the rest
    const filesToDelete = existingFiles.slice(9); // Keep first 9, delete from index 9 onwards

    for (const file of filesToDelete) {
      try {
        console.log(`  Deleting old version: ${file.filename} (${file.id})`);

        // Delete from BunnyCDN
        if (file.url) {
          try {
            await deleteFileFromBunny(file.url);
            console.log(`    ✅ Deleted from BunnyCDN: ${file.url}`);
          } catch (bunnyError) {
            console.error(`    ⚠️ Failed to delete from BunnyCDN:`, bunnyError);
            // Continue anyway - we'll still delete from DB
          }
        }

        // Delete from database
        await prisma.file.delete({
          where: { id: file.id },
        });
        console.log(`    ✅ Deleted from database`);

        cleanedUp = true;
      } catch (error) {
        console.error(`    ❌ Failed to delete file ${file.id}:`, error);
        // Continue with other files even if one fails
      }
    }

    if (cleanedUp) {
      console.log(`✅ Cleaned up ${filesToDelete.length} old version(s)`);
    }
  }

  return {
    nextVersion,
    cleanedUp,
  };
}

/**
 * Generates a versioned filename
 * 
 * @param baseFileName - Base name without version (e.g., 'BOM-ProjectName')
 * @param version - Version number
 * @param fileExtension - File extension (e.g., 'xlsx', 'docx')
 * @returns Versioned filename (e.g., 'BOM-ProjectName_v1.xlsx')
 */
export function generateVersionedFilename(
  baseFileName: string,
  version: number,
  fileExtension: string
): string {
  // Remove extension from baseFileName if it exists
  const cleanBaseName = baseFileName.replace(/\.\w+$/, '');
  
  // Ensure extension starts with a dot
  const cleanExtension = fileExtension.startsWith('.')
    ? fileExtension
    : `.${fileExtension}`;

  return `${cleanBaseName}_v${version}${cleanExtension}`;
}

