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
    // CRITICAL: Explicitly forbid text. Pollinations.ai is prone to adding gibberish text if keywords like "flyer" or "poster" are present.
    const cleanPrompt = prompt.replace(/flyer|poster|card|text|words|letters/gi, '').trim();
    return `${cleanPrompt}, clean background, artistic illustration, professional product photography, high quality, 8k, dramatic lighting, photographic style, photorealistic, NO TEXT, NO LETTERS, NO WORDS, NO LABELS, NO BRANDING, EMPTY BACKGROUND FOR TEXT OVERLAY`;
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
    if (lower.includes('gold') || lower.includes('luxury') || lower.includes('midnight')) return 'midnight_gold';
    if (lower.includes('leaf') || lower.includes('organic') || lower.includes('nature') || lower.includes('green')) return 'organic_leaf';
    if (lower.includes('brutalist') || lower.includes('bold') || lower.includes('yellow')) return 'neo_brutalist';
    if (lower.includes('mysterious') || lower.includes('dark') || lower.includes('space')) return 'mysterious';
    if (lower.includes('professional') || lower.includes('corporate') || lower.includes('business')) return 'professional';
    if (lower.includes('warm') || lower.includes('cozy') || lower.includes('friendly')) return 'warm';
    return 'midnight_gold'; // Default to a premium look
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
    const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured (checked GROQ_API_KEY and EXPO_PUBLIC_GROQ_API_KEY)");

    const theme = detectTheme(prompt);
    const palette = COLOR_PALETTES[theme as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.mysterious;

    const systemPrompt = `You are a world-class graphic designer. Generate a high-end JSON layout for a ${template}.
Focus on: **Compositional Awareness**, **Negative Space**, and **Visual Balance**.

DESIGNER MINDSET:
1. **IDENTIFY NEGATIVE SPACE**: Professional designers find the empty areas of an image and place text there. Do not cover the main subject (e.g., if there is a car or person in the center, use "leftColumn" or "rightColumn").
2. **GRID ALIGNMENT**: Snap elements to the grid patterns provided below. Do not use random coordinates.
3. **TYPOGRAPHY HIERARCHY**: 
   - H1: Giant (120-160px), ExtraBold, tracking: 4.
   - H2: Medium (60px), Medium weight, tracking: 2.
   - Body: Small (40px), Regular, tracking: 1.
4. **CONTRAST**: Always place a "shape" (id: "scrim") with a dark semi-transparent color behind text if it's over a photographic background.
5. **ASPECT RATIO**: Canvas is ${dimensions.width}x${dimensions.height}.

GRID PATTERNS:
${JSON.stringify(LAYOUT_PATTERNS, null, 2)}

Return ONLY valid JSON. No markdown.

Color Palette (${theme}):
${JSON.stringify(palette, null, 2)}`;

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
       "style": { "opacity": 0.95 },
       "zIndex": 0
     },
     {
       "id": "text_backing",
       "type": "shape",
       "shape": "rounded_rect",
       "rect": { "x": 80, "y": 150, "width": ${dimensions.width - 160}, "height": 400 },
       "style": { "backgroundColor": "rgba(0,0,0,0.4)", "borderRadius": 40 },
       "zIndex": 5
     },
     {
       "id": "title",
       "type": "text",
       "content": "INSERT_CLEAN_TITLE",
       "rect": { "x": 100, "y": 200, "width": ${dimensions.width - 200}, "height": 200 },
       "style": {
         "fontSize": 120,
         "fontWeight": "900",
         "color": "${palette.primary}",
         "textAlign": "center",
         "letterSpacing": 4,
         "textShadow": "0px 4px 30px rgba(0,0,0,0.9)"
       },
       "zIndex": 10
     }
   ]
 }
 
 IMPORTANT: Output ONLY the JSON. Do not use the words "flyer" or "poster" in your id or content fields.`;

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

    // Parse the JSON response with robust extraction
    try {
        const cleaned = extractJson(content);
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("[Layout Parse Error]:", content);
        throw new Error("Failed to parse layout JSON from AI");
    }
}

/**
 * Robustly extracts JSON from potentially messy AI output
 */
function extractJson(text: string): string {
    // 1. Try to find content between triple backticks
    const match = text.match(/```(?:json)?([\s\S]*?)```/);
    if (match) return match[1].trim();

    // 2. Try to find the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        return text.substring(firstBrace, lastBrace + 1).trim();
    }

    return text.trim();
}
