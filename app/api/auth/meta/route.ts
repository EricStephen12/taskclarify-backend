import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";

const META_APP_ID = process.env.META_APP_ID;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI;

export async function GET(req: NextRequest) {
  try {
    const { authenticated, user } = await authenticateRequest(req);
    if (!authenticated || !user) return unauthorizedResponse();

    if (!META_APP_ID || !META_REDIRECT_URI) {
      throw new Error('Missing Meta configuration in environment');
    }

    const scopes = ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"];

    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI!)}&state=${user.id}&scope=${scopes.join(",")}`;

    return NextResponse.redirect(url);
  } catch (err: any) {
    console.error('[Meta Auth Error]:', err.message);
    return NextResponse.json(
      { error: "Configuration Error", message: err.message },
      { status: 500 }
    );
  }
}
