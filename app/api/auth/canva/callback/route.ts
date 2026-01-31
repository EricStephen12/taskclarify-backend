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

    const authError = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (authError) {
      console.error('[Canva Callback] OAuth Error:', { error: authError, errorDescription });
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fff1f2; color: #be123c;">
            <div style="text-align: center; max-width: 600px; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <h1 style="margin: 0 0 1rem 0;">Connection Failed</h1>
              <p><strong>Error:</strong> ${authError}</p>
              <p style="color: #666; margin: 1rem 0;">${errorDescription || 'No description provided.'}</p>
              <p style="font-size: 0.9rem; margin-top: 2rem; color: #888;">Please verify that the required scopes are enabled in your Canva Developer Portal.</p>
            </div>
            <script>
              // Optional: Close window automatically if opened as popup
              // setTimeout(() => window.close(), 10000);
            </script>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    }

    // Debug logging for missing params
    console.log('[Canva Callback] Full URL:', req.url);
    console.log('[Canva Callback] Search Params:', Object.fromEntries(searchParams.entries()));

    if (!code) {
      console.error('[Canva Callback] Missing code parameter');
      return NextResponse.json({ error: "Missing 'code' parameter", params: Object.fromEntries(searchParams.entries()) }, { status: 400 });
    }

    if (!userId) {
      console.error('[Canva Callback] Missing state (userId) parameter');
      return NextResponse.json({ error: "Missing 'state' parameter", params: Object.fromEntries(searchParams.entries()) }, { status: 400 });
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

