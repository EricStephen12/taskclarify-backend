import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { getValidToken } from "@/lib/utils/tokens";
import { GmailIntegration } from "@/lib/integrations/gmail";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { authenticated, user } = await authenticateRequest(req);
  if (!authenticated || !user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { action, subject, body: emailBody, recipients } = body;

    const accessToken = await getValidToken(user.id, "google");

    let externalUrl = "";
    let externalId = "";
    let responseMessage = "";

    if (action === "send" || action === "schedule") {
      const result = await GmailIntegration.sendEmail(accessToken, { subject, body: emailBody, recipients });
      externalUrl = result.thread_url;
      externalId = result.message_id || "";
      responseMessage = "Email sent via Gmail";
    } else if (action === "draft") {
      const result = await GmailIntegration.createDraft(accessToken, { subject, body: emailBody, recipients });
      externalUrl = ""; // No URL for drafts yet
      externalId = result.draft_id || "";
      responseMessage = "Draft created in Gmail";
    } else {
      throw new Error(`Unsupported Gmail action: ${action}`);
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      externalUrl,
      externalId,
    });

  } catch (error: any) {
    console.error("[Gmail Integration Error]:", error);
    
    if (error.message.includes("not connected")) {
      return NextResponse.json({ 
        success: false, 
        message: "Google account not connected. Please go to settings to connect your Google account.",
        auth_required: true,
        platform: "google"
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      message: "Failed to process Gmail request.",
      error: error.message 
    }, { status: 500 });
  }
}