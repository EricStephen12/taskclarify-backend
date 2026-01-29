import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { getValidToken } from "@/lib/utils/tokens";
import { CanvaIntegration } from "@/lib/integrations/canva";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { authenticated, user } = await authenticateRequest(req);
  if (!authenticated || !user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { action, title, template, content } = body;

    const accessToken = await getValidToken(user.id, "canva");

    if (action === "create") {
      const result = await CanvaIntegration.createDesign(accessToken, title, template);
      return NextResponse.json({
        success: true,
        message: `Canva design "${title}" created successfully!`,
        url: result.url,
        id: result.id,
      });
    }

    throw new Error(`Unsupported Canva action: ${action}`);

  } catch (error: any) {
    console.error("[Canva Integration Error]:", error);
    
    if (error.message.includes("not connected")) {
      return NextResponse.json({ 
        success: false, 
        message: "Canva account not connected. Please connect your Canva account in settings.",
        auth_required: true,
        platform: "canva"
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      message: "Failed to create Canva design.",
      error: error.message 
    }, { status: 500 });
  }
}
