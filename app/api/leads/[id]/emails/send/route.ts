import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("📧 [EMAIL SEND] ========================================");
  console.log("📧 [EMAIL SEND] Starting email send request...");
  
  try {
    const session = await auth();
    if (!session) {
      console.error("📧 [EMAIL SEND] ❌ Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`📧 [EMAIL SEND] User: ${session.user.email}`);

    const { id } = await params;
    const data = await request.json();

    console.log(`📧 [EMAIL SEND] Lead ID: ${id}`);
    console.log(`📧 [EMAIL SEND] Recipients: ${data.to?.length || 0}`);
    console.log(`📧 [EMAIL SEND] Subject: ${data.subject}`);

    // Validate
    if (!data.to?.length) {
      console.error("📧 [EMAIL SEND] ❌ No recipients");
      return NextResponse.json({ error: "Recipients required" }, { status: 400 });
    }
    if (!data.subject?.trim()) {
      console.error("📧 [EMAIL SEND] ❌ No subject");
      return NextResponse.json({ error: "Subject required" }, { status: 400 });
    }
    if (!data.body?.trim()) {
      console.error("📧 [EMAIL SEND] ❌ No message body");
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Check lead
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!lead) {
      console.error(`📧 [EMAIL SEND] ❌ Lead not found: ${id}`);
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    console.log("📧 [EMAIL SEND] ✓ Lead found");

    // Get account
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: { in: ["microsoft", "google"] },
      },
    });

    if (!account) {
      console.error("📧 [EMAIL SEND] ❌ No email account connected for user");
      return NextResponse.json({ error: "No email account connected. Please connect your email in settings." }, { status: 400 });
    }

    if (!account.access_token) {
      console.error("📧 [EMAIL SEND] ❌ No access token in account");
      return NextResponse.json({ error: "Email account token expired. Please reconnect your email." }, { status: 400 });
    }

    console.log(`📧 [EMAIL SEND] ✓ Using ${account.provider} account`);
    console.log(`📧 [EMAIL SEND] Token expires: ${account.expires_at ? new Date(account.expires_at * 1000).toISOString() : 'unknown'}`);


    // HTML body
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <p>${data.body.replace(/\n/g, "<br>")}</p>
        <br>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent from KimonCRM regarding Lead ${data.metadata.leadNumber}:<br>
          <strong>${data.metadata.leadTitle}</strong>
        </p>
      </div>
    `;

    // Send
    let res;
    let errorDetails = null;
    
    try {
      if (account.provider === "microsoft") {
        const msg: any = {
          message: {
            subject: data.subject,
            body: { contentType: "HTML", content: html },
            toRecipients: data.to.map((r: any) => ({
              emailAddress: { address: r.email, name: r.name || r.email }
            })),
            internetMessageHeaders: [
              { name: "X-CRM-Lead-ID", value: data.metadata.leadId },
              { name: "X-CRM-Lead-Number", value: data.metadata.leadNumber },
              { name: "X-CRM-Tags", value: data.metadata.tags.join(",") },
            ],
          },
          saveToSentItems: true,
        };

        if (data.ccMyself && session.user.email) {
          msg.message.ccRecipients = [{
            emailAddress: { address: session.user.email, name: session.user.name || session.user.email }
          }];
        }

        res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(msg),
        });
      } else {
        const raw = Buffer.from(
          `To: ${data.to.map((r: any) => r.email).join(", ")}\r\n` +
          `Subject: ${data.subject}\r\n` +
          `Content-Type: text/html; charset=utf-8\r\n` +
          `X-CRM-Lead-ID: ${data.metadata.leadId}\r\n` +
          `X-CRM-Lead-Number: ${data.metadata.leadNumber}\r\n` +
          `X-CRM-Tags: ${data.metadata.tags.join(",")}\r\n\r\n` +
          html
        ).toString("base64url");

        res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw }),
        });
      }

      if (!res?.ok) {
        const errorText = await res.text();
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = errorText;
        }
        
        console.error("Email send failed:", {
          status: res.status,
          statusText: res.statusText,
          provider: account.provider,
          error: errorDetails,
        });

        // Check for token expiration
        if (res.status === 401) {
          return NextResponse.json(
            { 
              error: "Email account authentication expired. Please reconnect your email account in settings.",
              code: "AUTH_EXPIRED"
            },
            { status: 401 }
          );
        }

        // Check for rate limiting
        if (res.status === 429) {
          return NextResponse.json(
            { error: "Email sending rate limit exceeded. Please try again later." },
            { status: 429 }
          );
        }

        // Generic error with details
        const errorMessage = errorDetails?.error?.message || errorDetails?.message || "Failed to send email";
        return NextResponse.json(
          { 
            error: errorMessage,
            details: process.env.NODE_ENV === "development" ? errorDetails : undefined
          },
          { status: res.status }
        );
      }
    } catch (sendError: any) {
      console.error("Email send error:", sendError);
      return NextResponse.json(
        { 
          error: "Failed to send email. " + (sendError.message || "Unknown error"),
          details: process.env.NODE_ENV === "development" ? sendError.toString() : undefined
        },
        { status: 500 }
      );
    }

    // Save to DB (optional, don't fail if it errors)
    try {
      await prisma.emailThread.create({
        data: {
          provider: account.provider === "microsoft" ? "MICROSOFT" : "GOOGLE",
          subject: data.subject,
          leadId: id,
          messageCount: 1,
          lastMessageAt: new Date(),
          messages: {
            create: {
              provider: account.provider === "microsoft" ? "MICROSOFT" : "GOOGLE",
              fromEmail: session.user.email || "",
              fromName: session.user.name || "",
              subject: data.subject,
              toList: data.to,
              ccList: data.ccMyself ? [{ email: session.user.email, name: session.user.name }] : [],
              bccList: [],
              bodyText: data.body,
              bodyHtml: html,
              receivedAt: new Date(),
              sentAt: new Date(),
              isRead: true,
            },
          },
        },
      });
    } catch (dbErr) {
      console.error("DB save failed:", dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email send route error:", error);
    return NextResponse.json(
      { 
        error: "Failed to send email: " + (error.message || "Unknown error"),
        details: process.env.NODE_ENV === "development" ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}
