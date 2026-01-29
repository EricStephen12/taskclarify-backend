import { createOAuth2Client } from "@/lib/integrations/google";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state"); // We passed user.id as state

  if (!code || !userId) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens in Supabase
    const { error } = await supabase
      .from("user_integrations")
      .upsert({
        user_id: userId,
        platform: "google",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,platform" });

    if (error) throw error;

    // Redirect back to app (using custom scheme if mobile, or success page)
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #064e3b; color: white;">
          <div style="text-align: center;">
            <h1>Connection Successful!</h1>
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
  } catch (error) {
    console.error("[Google Auth Callback Error]:", error);
    return NextResponse.json({ error: "Failed to exchange code for tokens" }, { status: 500 });
  }
}
