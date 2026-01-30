import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI;

// Helper to generate PKCE values
function generatePKCE() {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  const challenge = base64URLEncode(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function base64URLEncode(str: Buffer) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function GET(req: NextRequest) {
  try {
    const { authenticated, user } = await authenticateRequest(req);
    if (!authenticated || !user) return unauthorizedResponse();

    if (!CANVA_CLIENT_ID || !CANVA_REDIRECT_URI) {
      throw new Error('Missing Canva configuration in environment');
    }

    const { verifier, challenge } = generatePKCE();

    const scopes = [
      "design:content:read",
      "design:content:write",
      "design:meta:read",
      "asset:read",
      "asset:write"
    ];

    const params = new URLSearchParams({
      response_type: "code",
      client_id: CANVA_CLIENT_ID,
      redirect_uri: CANVA_REDIRECT_URI,
      scope: scopes.join(" "),
      state: user.id,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    const url = `https://www.canva.com/api/oauth/authorize?${params.toString()}`;

    // Store verifier in cookie for callback
    const res = NextResponse.redirect(url);
    res.cookies.set("canva_code_verifier", verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });

    return res;
  } catch (err: any) {
    console.error('[Canva Auth Error]:', err.message);
    return NextResponse.json(
      { error: "Configuration Error", message: err.message },
      { status: 500 }
    );
  }
}
