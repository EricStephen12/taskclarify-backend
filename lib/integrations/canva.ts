import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { getValidToken } from "@/lib/utils/tokens";
import { NextRequest, NextResponse } from "next/server";

export class CanvaIntegration {
  static async createDesign(accessToken: string, title: string, templateId?: string) {
    const response = await fetch("https://api.canva.com/rest/v1/designs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        design_type: templateId || "FLYER", 
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Canva API error");

    return {
      success: true,
      url: data.url,
      id: data.id,
    };
  }
}
