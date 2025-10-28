import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

async function getAccessToken() {
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { folderName, parentPath } = body;

    if (!folderName) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const userEmail = session.user?.email || "";
    const driveUrl = `https://graph.microsoft.com/v1.0/users/${userEmail}/drive`;

    // Determine the parent folder path
    let parentFolderUrl = `${driveUrl}/root`;
    if (parentPath && parentPath !== "/" && !parentPath.startsWith("https://")) {
      // It's a folder ID
      parentFolderUrl = `${driveUrl}/items/${parentPath}`;
    }

    // Create folder in OneDrive
    const createFolderUrl = `${parentFolderUrl}/children`;
    const response = await fetch(createFolderUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Create folder error:", errorText);
      throw new Error(`Failed to create folder: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      folder: data,
    });
  } catch (error) {
    console.error("Create folder API error:", error);
    return NextResponse.json(
      {
        error: "Failed to create folder",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
