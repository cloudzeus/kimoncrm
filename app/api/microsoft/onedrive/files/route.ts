import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

async function getAccessToken() {
  // Get Microsoft Graph access token using client credentials
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID || process.env.GRAPH_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error("Microsoft Graph credentials not configured");
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "https://graph.microsoft.com/.default",
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "user";
    const folderPath = searchParams.get("path") || "/"; // Folder path

    // TODO: Fix tenant ID - the Graph Client ID is registered in a different tenant
    // For now, return mock data until the Graph API is properly configured
    let accessToken: string | null = null;
    try {
      accessToken = await getAccessToken();
    } catch (error) {
      console.error("Failed to get access token, using mock data:", error);
    }
    const userEmail = session.user?.email || "";

    // Only try to use Graph API if we have a valid access token
    if (!accessToken) {
      throw new Error("No access token available");
    }

    // Construct the Graph API URL for OneDrive
    let driveUrl: string;
    
    if (type === "tenant") {
      // Organization OneDrive - get the default SharePoint site
      // First, get the site ID
      const siteUrl = "https://advancedintegratedcommunica.sharepoint.com";
      driveUrl = `https://graph.microsoft.com/v1.0/sites/${siteUrl}/drive`;
    } else {
      // User's personal OneDrive
      driveUrl = `https://graph.microsoft.com/v1.0/users/${userEmail}/drive`;
    }

    // Get items in the drive or specific folder
    let itemsUrl: string;
    
    if (folderPath === "/" || folderPath === "") {
      // Get root items
      itemsUrl = `${driveUrl}/root/children`;
    } else if (folderPath.startsWith("https://")) {
      // This is a web URL, extract the folder ID from it
      // For now, return root items
      itemsUrl = `${driveUrl}/root/children`;
    } else {
      // This should be a folder ID
      // Check if it looks like a folder path (contains slashes)
      if (folderPath.includes("/")) {
        // It's a path, try to use it as a path
        const cleanPath = folderPath.startsWith("/") ? folderPath.slice(1) : folderPath;
        itemsUrl = `${driveUrl}/root:/${cleanPath}:/children`;
      } else {
        // It's a folder ID
        itemsUrl = `${driveUrl}/items/${folderPath}/children`;
      }
    }

    const response = await fetch(itemsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Graph API error:", errorText);
      
      // If Graph API fails, return mock data
      const mockFiles = [
        {
          name: "Documents",
          path: "/Documents",
          isFolder: true,
          modified: new Date().toISOString(),
        },
        {
          name: "Pictures",
          path: "/Pictures",
          isFolder: true,
          modified: new Date().toISOString(),
        },
        {
          name: "report.pdf",
          path: "/report.pdf",
          isFolder: false,
          size: 245678,
          modified: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          name: "presentation.pptx",
          path: "/presentation.pptx",
          isFolder: false,
          size: 1234567,
          modified: new Date(Date.now() - 172800000).toISOString(),
        },
      ];

      return NextResponse.json({
        success: true,
        type,
        userEmail,
        path: folderPath,
        files: mockFiles,
        message: "Using mock data - Graph API unavailable",
      });
    }

    const data = await response.json();
    
    // Transform Graph API response to our format
    const files = (data.value || []).map((item: any) => ({
      name: item.name,
      path: item.id, // Use folder ID instead of web URL for navigation
      isFolder: 'folder' in item,
      size: item.size,
      modified: item.lastModifiedDateTime,
      folderId: item.id, // Store the ID for folder navigation
    }));

    return NextResponse.json({
      success: true,
      type,
      userEmail,
      path: folderPath,
      files,
    });
  } catch (error) {
    console.error("OneDrive files API error:", error);
    
    // Return mock data on error
    const mockFiles = [
      {
        name: "Documents",
        path: "/Documents",
        isFolder: true,
        modified: new Date().toISOString(),
      },
      {
        name: "Pictures",
        path: "/Pictures",
        isFolder: true,
        modified: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      files: mockFiles,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
