import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { COLOR_PALETTES, DESIGN_DIMENSIONS, DesignBlueprint, LAYOUT_PATTERNS } from "@/lib/schema/design";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/design/generate
 * 
 * Generates a complete design blueprint (JSON) based on user prompt.
 * This REPLACES the Canva integration with our internal design engine.
 * 
 * Request Body:
 * {
 *   "prompt": "Create a mysterious launch poster for Galaxy Shoes",
 *   "template": "poster" | "flyer" | "card" | etc.
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "blueprint": { ... DesignBlueprint JSON ... }
 * }
 */
export async function POST(req: NextRequest) {
    const { authenticated, user } = await authenticateRequest(req);
    if (!authenticated || !user) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { prompt, template = "poster" } = body;

        if (!prompt) {
            return NextResponse.json({
                success: false,
                message: "Prompt is required"
            }, { status: 400 });
        }

        // ========================================================================
        // STEP 1: Generate Background Image
        // ========================================================================
        const imagePrompt = extractVisualDescription(prompt);
        const imageUrl = await generateImage(imagePrompt);

        // ========================================================================
        // STEP 2: Generate Layout JSON using Groq
        // ========================================================================
        const dimensions = DESIGN_DIMENSIONS[template] || DESIGN_DIMENSIONS["poster"];
        const layoutJson = await generateLayout(prompt, template, dimensions, imageUrl);

        // ========================================================================
        // STEP 3: Construct Final Blueprint
        // ========================================================================
        const blueprint: DesignBlueprint = {
            id: `design-${Date.now()}`,
            version: '1.0',
            canvas: {
                width: dimensions.width,
                height: dimensions.height,
                backgroundColor: layoutJson.backgroundColor || '#000000'
            },
            elements: layoutJson.elements,
            metadata: {
                title: extractTitle(prompt),
                template,
                theme: detectTheme(prompt),
                createdAt: new Date().toISOString()
            }
        };

        return NextResponse.json({
            success: true,
            blueprint
        });

    } catch (error: any) {
        console.error("[Design Generation Error]:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to generate design",
            error: error.message
        }, { status: 500 });
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate image using Pollinations.ai (same as before)
 */
async function generateImage(visualPrompt: string): Promise<string> {
    const encodedPrompt = encodeURIComponent(visualPrompt);
    const width = 1080;
    const height = 1920;

    // Pollinations.ai generates and returns the image URL directly
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&enhance=true`;
}

/**
 * Extract visual description from user prompt
 */
function extractVisualDescription(prompt: string): string {
    // For now, use the entire prompt. Later, we can use Groq to extract just the visual part.
    return `${prompt}, professional product photography, high quality, 8k, dramatic lighting`;
}

/**
 * Extract title from prompt (simple heuristic)
 */
function extractTitle(prompt: string): string {
    // Look for quoted text or use first few words
    const match = prompt.match(/"([^"]+)"/);
    if (match) return match[1];

    const words = prompt.split(' ').slice(0, 4).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Detect theme from prompt keywords
 */
function detectTheme(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('mysterious') || lower.includes('dark') || lower.includes('space')) return 'mysterious';
    if (lower.includes('energetic') || lower.includes('vibrant') || lower.includes('neon')) return 'energetic';
    if (lower.includes('professional') || lower.includes('corporate') || lower.includes('business')) return 'professional';
    if (lower.includes('warm') || lower.includes('cozy') || lower.includes('friendly')) return 'warm';
    return 'mysterious'; // Default
}

/**
 * Generate layout JSON using Groq AI
 */
async function generateLayout(
    prompt: string,
    template: string,
    dimensions: { width: number; height: number },
    imageUrl: string
): Promise<any> {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const theme = detectTheme(prompt);
    const palette = COLOR_PALETTES[theme as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.mysterious;

    const systemPrompt = `You are a professional layout designer. Generate a JSON layout for a ${template}.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown, no explanations.
2. Use the provided color palette and dimensions.
3. Position elements so they don't overlap awkwardly.
4. Use the LAYOUT_PATTERNS as a guide for positioning.
5. Keep text concise and impactful.

Available Layout Patterns:
${JSON.stringify(LAYOUT_PATTERNS, null, 2)}

Color Palette (${theme}):
${JSON.stringify(palette, null, 2)}

Canvas Dimensions:
${JSON.stringify(dimensions, null, 2)}`;

    const userPrompt = `Design a ${template} for: "${prompt}"

Background image URL: ${imageUrl}

Return JSON with this structure:
{
  "backgroundColor": "${palette.bg}",
  "elements": [
    {
      "id": "bg_image",
      "type": "image",
      "src": "${imageUrl}",
      "rect": { "x": 0, "y": 0, "width": ${dimensions.width}, "height": ${dimensions.height} },
      "style": { "opacity": 0.85 },
      "zIndex": 0
    },
    {
      "id": "title",
      "type": "text",
      "content": "YOUR TITLE HERE",
      "rect": { "x": 60, "y": 200, "width": ${dimensions.width - 120}, "height": 300 },
      "style": {
        "fontSize": 88,
        "fontWeight": "800",
        "color": "${palette.primary}",
        "textAlign": "center",
        "letterSpacing": 8,
        "textShadow": "0px 4px 20px rgba(0,0,0,0.8)"
      },
      "zIndex": 10
    }
    // Add more elements as needed (subtitle, CTA button, etc.)
  ]
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "{}";

    // Parse the JSON response
    try {
        return JSON.parse(content);
    } catch (e) {
        console.error("[Layout Parse Error]:", content);
        throw new Error("Failed to parse layout JSON from AI");
    }
}
