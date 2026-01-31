import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";

/**
 * Image Generation Route
 * Uses Pollinations.ai for high-quality, free image generation
 */
export async function POST(req: NextRequest) {
    const { authenticated, user } = await authenticateRequest(req);
    if (!authenticated || !user) return unauthorizedResponse();

    try {
        const { prompt, width = 1024, height = 1024, enhance = true } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // Pollinations.ai URL structure
        // We encode the prompt to ensure it works as a URL segment
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&enhance=${enhance}&nologo=true`;

        // To ensure the image is "real" and ready, we can do a head request or just return the URL
        // For Pollinations, the URL itself is the generation trigger.

        return NextResponse.json({
            success: true,
            url: imageUrl,
            prompt: prompt
        });

    } catch (error: any) {
        console.error("[Image Gen Error]:", error);
        return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }
}
