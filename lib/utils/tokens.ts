import { supabase } from "@/lib/supabase";
import { createOAuth2Client } from "@/lib/integrations/google";

export async function getValidToken(userId: string, platform: string) {
  const { data: integration, error } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .single();

  if (error || !integration) {
    throw new Error(`Platform ${platform} not connected`);
  }

  const now = new Date();
  const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;

  // If token is expired or expires in less than 5 minutes, refresh it
  if (expiresAt && (expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
    if (platform === "google") {
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: integration.refresh_token,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      const updatedExpiresAt = credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null;

      await supabase
        .from("user_integrations")
        .update({
          access_token: credentials.access_token,
          expires_at: updatedExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id);

      return credentials.access_token;
    }

    if (platform === "canva") {
      const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
      const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;
      const authHeader = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString("base64");

      const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: integration.refresh_token,
        }),
      });

      const tokens = await response.json();
      if (!response.ok) throw new Error(tokens.message || "Canva refresh failed");

      await supabase
        .from("user_integrations")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id);

      return tokens.access_token;
    }
  }

  return integration.access_token;
}
