import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { getValidToken } from "@/lib/utils/tokens";
import { GoogleIntegration } from "@/lib/integrations/google";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { authenticated, user } = await authenticateRequest(req);
  if (!authenticated || !user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { platform, action, title, content } = body;

    // Get a valid access token (refreshes if needed)
    const accessToken = await getValidToken(user.id, "google");

    let result;
    if (platform === "google_docs") {
      result = await GoogleIntegration.createDocument(accessToken, title, content);
    } else if (platform === "google_sheets") {
      result = await GoogleIntegration.createSpreadsheet(accessToken, title);
    } else if (platform === "google_slides") {
      result = await GoogleIntegration.createPresentation(accessToken, title);
    } else {
      throw new Error(`Unsupported Google platform: ${platform}`);
    }

    return NextResponse.json({
      success: true,
      message: `Created in ${platform.replace("google_", "").toUpperCase()}`,
      url: result.url,
      id: result.id,
    });

  } catch (error: any) {
    console.error("[Google Integration Error]:", error);
    
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
      message: "Failed to create Google document.",
      error: error.message 
    }, { status: 500 });
  }
}
