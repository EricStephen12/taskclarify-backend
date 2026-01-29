import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";

const META_APP_ID = process.env.META_APP_ID;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI;

export async function GET(req: NextRequest) {
  const { authenticated, user } = await authenticateRequest(req);
  if (!authenticated || !user) return unauthorizedResponse();

  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_manage_posts",
    "pages_read_engagement",
    "business_management",
    "public_profile"
  ];

  const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI!)}&scope=${encodeURIComponent(scopes.join(","))}&state=${user.id}`;

  return NextResponse.redirect(url);
}
