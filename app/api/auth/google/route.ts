import { createOAuth2Client } from "@/lib/integrations/google";
import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { authenticated, user } = await authenticateRequest(req);
  if (!authenticated || !user) return unauthorizedResponse();

  const oauth2Client = createOAuth2Client();
  
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/presentations",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: user.id, // Pass user ID to associate token on callback
  });

  return NextResponse.redirect(url);
}
