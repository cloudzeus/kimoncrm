import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";
import { generateEmailSignature } from "@/lib/email/signature";
import { prisma as db } from "@/lib/db/prisma";

/**
 * GET /api/test-email - Test email sending functionality
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    console.log("=== EMAIL TEST STARTED ===");
    console.log("User Email:", session.user.email);
    console.log("User ID:", session.user.id);
    
    // Test 1: Check environment variables
    console.log("\n--- Environment Check ---");
    const hasGraphCreds = !!(
      process.env.GRAPH_TENANT_ID && 
      process.env.AUTH_MICROSOFT_ENTRA_ID_ID && 
      process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET
    );
    console.log("Graph Credentials:", hasGraphCreds ? "✓ Present" : "✗ Missing");
    console.log("Tenant ID:", process.env.GRAPH_TENANT_ID ? "✓" : "✗");
    console.log("Client ID:", process.env.AUTH_MICROSOFT_ENTRA_ID_ID ? "✓" : "✗");
    console.log("Client Secret:", process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET ? "✓" : "✗");
    
    // Test 2: Generate signature
    console.log("\n--- Signature Generation ---");
    let signature = '';
    try {
      signature = await generateEmailSignature(session.user.id, db);
      console.log("Signature Generation:", signature ? "✓ Success" : "⚠ Empty");
    } catch (error: any) {
      console.log("Signature Generation:", "✗ Failed");
      console.error("Signature Error:", error.message);
    }
    
    // Test 3: Try sending test email
    console.log("\n--- Email Sending Test ---");
    const testRecipient = session.user.email; // Send to yourself
    const testSubject = "🧪 Test Email from KIMON CRM";
    const testBody = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>✅ Email Test Successful!</h2>
        <p>If you receive this email, the email sending functionality is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Sent at: ${new Date().toISOString()}</li>
          <li>User: ${session.user.name || session.user.email}</li>
          <li>User Email: ${session.user.email}</li>
        </ul>
        ${signature}
      </body>
      </html>
    `;
    
    try {
      await sendEmailAsUser(
        session.user.email,
        testSubject,
        testBody,
        [testRecipient]
      );
      console.log("Email Sent:", "✓ Success");
      console.log("Recipient:", testRecipient);
      
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testRecipient}`,
        details: {
          sender: session.user.email,
          recipient: testRecipient,
          hasSignature: !!signature,
          hasGraphCreds: hasGraphCreds
        }
      });
    } catch (error: any) {
      console.log("Email Sent:", "✗ Failed");
      console.error("Send Error:", error.message);
      console.error("Full Error:", error);
      
      return NextResponse.json({
        success: false,
        error: error.message,
        details: {
          sender: session.user.email,
          recipient: testRecipient,
          hasSignature: !!signature,
          hasGraphCreds: hasGraphCreds,
          errorType: error.constructor.name
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("=== EMAIL TEST FAILED ===");
    console.error("Error:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error occurred",
      stack: error.stack
    }, { status: 500 });
  }
}

