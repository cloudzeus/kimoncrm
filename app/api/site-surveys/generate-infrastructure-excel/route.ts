import { NextRequest, NextResponse } from 'next/server';
import { generateBuildingExcelReport } from '@/lib/excel/building-report-excel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buildings, siteSurveyId, siteSurveyName } = body;

    if (!buildings || !Array.isArray(buildings) || buildings.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid buildings data' },
        { status: 400 }
      );
    }

    // Generate the Excel workbook for the first building
    const workbook = await generateBuildingExcelReport(buildings[0]);
    
    // Convert workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the file
    const filename = `Infrastructure-Report-${siteSurveyName || 'Site-Survey'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating infrastructure Excel:', error);
    return NextResponse.json(
      { error: 'Failed to generate infrastructure Excel', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

