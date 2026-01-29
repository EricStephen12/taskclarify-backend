import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    const authHeader = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString("base64");
    
    const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: CANVA_REDIRECT_URI!,
      }),
    });

    const tokens = await response.json();
    if (!response.ok) throw new Error(tokens.message || "Canva token exchange failed");

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

    return new NextResponse(`
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
  } catch (error: any) {
    console.error("[Canva Auth Callback Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to exchange code" }, { status: 500 });
  }
}
