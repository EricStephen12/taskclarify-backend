import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const userId = searchParams.get("state");

    if (!code || !userId) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    const codeVerifier = req.cookies.get("canva_code_verifier")?.value;

    // Construct params including PKCE if verifier exists
    const params: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: CANVA_REDIRECT_URI!,
    };

    if (codeVerifier) {
      params.code_verifier = codeVerifier;
    }

    const authHeader = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString("base64");

    // Log for debugging 400 errors (minus secret)
    console.log('[Canva Auth] Exchanging code:', {
      hasVerifier: !!codeVerifier,
      redirectUri: CANVA_REDIRECT_URI,
      hasSecrets: !!CANVA_CLIENT_ID && !!CANVA_CLIENT_SECRET
    });

    const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    });

    const tokens = await response.json();
    if (!response.ok) throw new Error(tokens.message || "Canva token exchange failed");

    // Clear the PKCE cookie
    const res = new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #064e3b; color: white;">
          <div style="text-align: center;">
            <h1>Canva Connected!</h1>
            <p>You can now close this window and return to TaskClarify.</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </div>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" },
    });

    res.cookies.delete("canva_code_verifier");

    const { error } = await supabase
      .from("user_integrations")
      .upsert({
        user_id: userId,
        platform: "canva",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,platform" });

    if (error) throw error;

    return res;
  } catch (err: any) {
    console.error("[Canva Auth Callback Error]:", err.message);
    return NextResponse.json({ error: "Token Exchange Failed", message: err.message }, { status: 500 });
  }
}

