import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MicrosoftGraphClient } from "@/lib/microsoft/graph";

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

    // Return OneDrive web URLs
    // Get the logged-in user's email
    const userEmail = session.user?.email || "";
    
    // For user OneDrive, use the account's email to construct the proper URL
    let webUrl: string;

    if (type === "tenant") {
      // SharePoint OneDrive (organization shared files)
      webUrl = "https://advancedintegratedcommunica.sharepoint.com/_layouts/15/onedrive.aspx";
    } else {
      // Personal OneDrive for the logged-in user
      // Construct OneDrive URL with user's email
      // Format: https://{tenant}.sharepoint.com/personal/{email}
      
      if (userEmail) {
        // Extract the email local part (before @) and domain
        const emailParts = userEmail.split("@");
        const emailUsername = emailParts[0];
        const emailDomain = emailParts[1];
        
        if (emailDomain === "aic.gr" || emailDomain === "i4ria.com") {
          // Organization OneDrive - personal drive
          // Convert email to SharePoint format: email%40domain.com
          const encodedEmail = userEmail.replace("@", "_");
          webUrl = `https://advancedintegratedcommunica.sharepoint.com/personal/${encodedEmail}/_layouts/15/onedrive.aspx`;
        } else {
          // Personal OneDrive (live.com)
          webUrl = "https://onedrive.live.com/";
        }
      } else {
        webUrl = "https://onedrive.live.com/";
      }
    }

    return NextResponse.json({
      success: true,
      webUrl,
      type,
      userEmail: session.user?.email,
    });
  } catch (error) {
    console.error("OneDrive API error:", error);
    return NextResponse.json(
      {
        error: "Failed to access OneDrive",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
