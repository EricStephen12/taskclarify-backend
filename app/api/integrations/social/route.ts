import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { getValidToken } from "@/lib/utils/tokens";
import { SocialIntegration } from "@/lib/integrations/social";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { authenticated, user } = await authenticateRequest(req);
  if (!authenticated || !user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { action, platform_tag, content, schedule_at, image_url } = body;

    const accessToken = await getValidToken(user.id, "meta");

    if (platform_tag === "instagram" || platform_tag === "facebook") {
      const result = await SocialIntegration.postToInstagram(accessToken, image_url, content);
      return NextResponse.json({
        success: true,
        message: `Posted to ${platform_tag} successfully!`,
        url: result.url,
        id: result.id,
      });
    }

    throw new Error(`Unsupported platform: ${platform_tag}`);

  } catch (error: any) {
    console.error("[Social Integration Error]:", error);
    
    if (error.message.includes("not connected")) {
      return NextResponse.json({ 
        success: false, 
        message: "Social account not connected. Please connect your Facebook/Instagram in settings.",
        auth_required: true,
        platform: "meta"
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      message: "Failed to post to social media.",
      error: error.message 
    }, { status: 500 });
  }
}
