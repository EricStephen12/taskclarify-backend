import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI!)}&client_secret=${META_APP_SECRET}&code=${code}`);

    const tokens = await response.json();
    if (!response.ok) throw new Error(tokens.error?.message || "Meta token exchange failed");

    // Meta user tokens don't usually have a refresh_token in this flow, they expire.
    // For production, you'd exchange this for a long-lived token.
    const { error } = await supabase
      .from("user_integrations")
      .upsert({
        user_id: userId,
        platform: "meta",
        access_token: tokens.access_token,
        expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,platform" });

    if (error) throw error;

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #064e3b; color: white;">
          <div style="text-align: center;">
            <h1>Meta Connected!</h1>
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
    console.error("[Meta Auth Callback Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to exchange code" }, { status: 500 });
  }
}
