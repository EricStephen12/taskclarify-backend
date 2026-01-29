import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { getValidToken } from "@/lib/utils/tokens";
import { CalendarIntegration } from "@/lib/integrations/calendar";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { authenticated, user } = await authenticateRequest(req);
  if (!authenticated || !user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { action, title, start_time, duration_mins, description, location } = body;

    const accessToken = await getValidToken(user.id, "google");

    const result = await CalendarIntegration.createEvent(accessToken, {
      title,
      start_time,
      duration_mins,
      description,
      location,
    });

    return NextResponse.json({
      success: true,
      message: `Event "${title}" scheduled in your calendar!`,
      url: result.html_link,
      id: result.id,
    });

  } catch (error: any) {
    console.error("[Calendar Integration Error]:", error);
    
    if (error.message.includes("not connected")) {
      return NextResponse.json({ 
        success: false, 
        message: "Google Calendar not connected. Please connect your Google account in settings.",
        auth_required: true,
        platform: "google"
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      message: "Failed to schedule calendar event.",
      error: error.message 
    }, { status: 500 });
  }
}
