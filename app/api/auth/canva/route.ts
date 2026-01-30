import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI;

export async function GET(req: NextRequest) {
  try {
    const { authenticated, user } = await authenticateRequest(req);
    if (!authenticated || !user) return unauthorizedResponse();

    if (!CANVA_CLIENT_ID || !CANVA_REDIRECT_URI) {
      throw new Error('Missing Canva configuration in environment');
    }

    const scopes = [
      "design:content:read",
      "design:content:write",
      "design:meta:read",
      "asset:read",
      "asset:write"
    ];

    const url = `https://www.canva.com/api/oauth/authorize?response_type=code&client_id=${CANVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(CANVA_REDIRECT_URI!)}&scope=${encodeURIComponent(scopes.join(" "))}&state=${user.id}`;

    return NextResponse.redirect(url);
  } catch (err: any) {
    console.error('[Canva Auth Error]:', err.message);
    return NextResponse.json(
      { error: "Configuration Error", message: err.message },
      { status: 500 }
    );
  }
}
