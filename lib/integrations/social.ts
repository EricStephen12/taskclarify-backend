import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { getValidToken } from "@/lib/utils/tokens";
import { NextRequest, NextResponse } from "next/server";

export class SocialIntegration {
  static async postToInstagram(accessToken: string, imageUrl: string, caption: string) {
    // 1. Get Instagram Business Account ID
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();
    if (!pagesResponse.ok) throw new Error(pagesData.error?.message || "Failed to fetch pages");

    const pageId = pagesData.data[0]?.id;
    if (!pageId) throw new Error("No Facebook page connected to this account");

    const igResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
    const igData = await igResponse.json();
    const igAccountId = igData.instagram_business_account?.id;
    if (!igAccountId) throw new Error("No Instagram Business account linked to this page");

    // 2. Create Media Container
    const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`, {
      method: "POST"
    });
    const containerData = await containerResponse.json();
    if (!containerResponse.ok) throw new Error(containerData.error?.message || "Media container creation failed");

    const creationId = containerData.id;

    // 3. Publish Media
    const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`, {
      method: "POST"
    });
    const publishData = await publishResponse.json();
    if (!publishResponse.ok) throw new Error(publishData.error?.message || "Media publishing failed");

    return {
      success: true,
      id: publishData.id,
      url: `https://www.instagram.com/p/${publishData.id}` 
    };
  }
}
