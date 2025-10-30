import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * GET - Proxy endpoint to download files from BunnyCDN
 * This solves CORS issues by fetching the file server-side
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const filename = searchParams.get('filename');

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    console.log('Proxying file download from:', url);

    // Fetch the file from BunnyCDN
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Failed to fetch file from BunnyCDN:', response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the file as a buffer
    const buffer = await response.arrayBuffer();
    console.log('File fetched successfully, size:', buffer.byteLength);

    // Determine content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Use standard Response (not NextResponse) to avoid ByteString conversion issues with Greek characters
    // Encode filename for proper UTF-8 support
    const encodedFilename = encodeURIComponent(filename || 'download');
    
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="download.xlsx"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error("Error proxying file download:", error);
    return NextResponse.json(
      {
        error: "Failed to download file",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

