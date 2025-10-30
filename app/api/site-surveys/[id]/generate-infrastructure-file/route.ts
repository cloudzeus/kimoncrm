import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { generateBuildingExcelReport } from "@/lib/excel/building-report-excel";
import { bunnyPut } from "@/lib/bunny/upload";
import { createSafeFilename, sanitizeFilename } from "@/lib/utils/greeklish";

/**
 * POST - Generate Infrastructure File and Upload to BunnyCDN
 * Creates an Excel file with all infrastructure details, uploads to BunnyCDN,
 * links it to the associated lead or customer, and maintains versioning (max 10 versions)
 * 
 * If site survey is linked to a lead, files are stored under LEAD entity type.
 * If site survey is only linked to a customer, files are stored under CUSTOMER entity type.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: siteSurveyId } = await params;
    const body = await request.json();
    const { buildings } = body;

    if (!buildings || !Array.isArray(buildings) || buildings.length === 0) {
      return NextResponse.json(
        { error: "No buildings data provided" },
        { status: 400 }
      );
    }

    // Get site survey with lead info
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      include: {
        lead: {
          select: {
            id: true,
            leadNumber: true,
            title: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    // Determine if we're linking to a lead or customer
    const isLinkedToLead = !!siteSurvey.leadId;
    const isLinkedToCustomer = !!siteSurvey.customerId;

    if (!isLinkedToLead && !isLinkedToCustomer) {
      return NextResponse.json(
        { error: "Site survey is not linked to a lead or customer" },
        { status: 400 }
      );
    }

    // Use lead info if available, otherwise use customer info
    const entityId = siteSurvey.leadId || siteSurvey.customerId;
    const entityType = isLinkedToLead ? 'LEAD' : 'CUSTOMER';
    const referenceNumber = siteSurvey.lead?.leadNumber || siteSurvey.customer?.name || "REF";
    const customerName = siteSurvey.customer?.name || "Customer";

    // Generate Excel files for all buildings
    const generatedFiles = [];
    const errors = [];

    for (let i = 0; i < buildings.length; i++) {
      const building = buildings[i];
      const buildingName = building.name || `Building-${i + 1}`;
      
      try {
        // Generate Excel workbook
        const workbook = await generateBuildingExcelReport(building);
        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

        // Determine version number for this building
        // Search pattern: "{referenceNumber} - Infrastructure - {buildingName} - v"
        const baseFileName = `${referenceNumber} - Infrastructure - ${buildingName}`;
        const existingFiles = await prisma.file.findMany({
          where: {
            entityId: entityId!,
            type: entityType,
            name: {
              startsWith: baseFileName,
              contains: ' - v',
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        // Calculate next version number
        let versionNumber = 1;
        if (existingFiles.length > 0) {
          // Extract version numbers from existing files
          const versions = existingFiles
            .map(f => {
              const match = f.name.match(/ - v(\d+)\.xlsx$/);
              return match ? parseInt(match[1]) : 0;
            })
            .filter(v => v > 0);
          
          if (versions.length > 0) {
            versionNumber = Math.max(...versions) + 1;
          }
        }

        // Check if we have reached max versions (10)
        if (existingFiles.length >= 10) {
          // Delete the oldest version to make room for the new one
          const oldestFile = existingFiles[existingFiles.length - 1];
          await prisma.file.delete({
            where: { id: oldestFile.id },
          });
        }

        // Create safe filename with Greeklish conversion
        const safeBuildingName = sanitizeFilename(buildingName, { preserveExtension: false });
        const safeReference = sanitizeFilename(referenceNumber, { preserveExtension: false });
        const filename = `${safeReference} - Infrastructure - ${safeBuildingName} - v${versionNumber}.xlsx`;

        // Upload to BunnyCDN
        const timestamp = Date.now();
        const entityFolder = entityType === 'LEAD' ? 'leads' : 'customers';
        const bunnyPath = `${entityFolder}/${entityId}/infrastructure/${timestamp}_${filename}`;
        
        const uploadResult = await bunnyPut(bunnyPath, buffer);

        // Save file record to database linked to LEAD or CUSTOMER
        const fileRecord = await prisma.file.create({
          data: {
            name: filename,
            filetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: buffer.length,
            url: uploadResult.url,
            entityId: entityId!,
            type: entityType,
            description: `Infrastructure report for ${buildingName} - Generated from Site Survey (v${versionNumber})`,
          },
        });

        generatedFiles.push({
          buildingName,
          filename,
          fileId: fileRecord.id,
          url: uploadResult.url,
          version: versionNumber,
        });

      } catch (error) {
        console.error(`Error generating file for building ${buildingName}:`, error);
        errors.push({
          buildingName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Return results
    if (generatedFiles.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to generate any files',
          details: errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${generatedFiles.length} infrastructure file(s)`,
      files: generatedFiles,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Error in generate-infrastructure-file:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate infrastructure file",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

