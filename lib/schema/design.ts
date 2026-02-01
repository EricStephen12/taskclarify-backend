/**
 * TaskClarify Internal Design Engine - Schema Definition
 * 
 * This defines the "DNA" of our designs - the JSON blueprint structure
 * that the backend generates and the mobile app renders.
 */

// ============================================================================
// CANVAS DIMENSIONS (Reused from Canva integration)
// ============================================================================

export const DESIGN_DIMENSIONS: Record<string, { width: number; height: number }> = {
    "poster": { width: 1080, height: 1920 },      // Vertical poster (9:16)
    "flyer": { width: 816, height: 1056 },        // Standard US Letter portrait
    "card": { width: 1500, height: 1050 },        // 5x7 Landscape Card
    "birthday_card": { width: 1500, height: 1050 },
    "social": { width: 1080, height: 1080 },      // Square Social Media Post
    "instagram": { width: 1080, height: 1080 },
    "story": { width: 1080, height: 1920 },       // Instagram/FB Story
    "banner": { width: 1920, height: 1080 },      // Horizontal banner (16:9)
};

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TextStyle {
    fontSize: number;
    fontWeight?: '400' | '500' | '600' | '700' | '800' | '900';
    color: string;
    textAlign?: 'left' | 'center' | 'right';
    letterSpacing?: number;
    lineHeight?: number;
    textShadow?: string; // CSS-like: "0px 4px 20px rgba(0,0,0,0.5)"
    fontFamily?: string; // Default: 'System' (uses device default)
}

export interface ShapeStyle {
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    shadowColor?: string;
    shadowOpacity?: number;
    shadowRadius?: number;
    shadowOffset?: { x: number; y: number };
    opacity?: number;
}

export interface ImageStyle {
    opacity?: number;
    borderRadius?: number;
    resizeMode?: 'cover' | 'contain' | 'stretch';
}

// ============================================================================
// ELEMENT TYPES
// ============================================================================

export interface TextElement {
    id: string;
    type: 'text';
    content: string;
    rect: Rect;
    style: TextStyle;
    zIndex?: number;
}

export interface ImageElement {
    id: string;
    type: 'image';
    src: string; // URL to the image
    rect: Rect;
    style?: ImageStyle;
    zIndex?: number;
}

export interface ShapeElement {
    id: string;
    type: 'shape';
    shape: 'rect' | 'rounded_rect' | 'circle' | 'ellipse';
    rect: Rect;
    style: ShapeStyle;
    zIndex?: number;
    children?: TextElement[]; // For buttons with text inside
}

export type DesignElement = TextElement | ImageElement | ShapeElement;

// ============================================================================
// BLUEPRINT (The Complete Design)
// ============================================================================

export interface DesignBlueprint {
    id: string;
    version: '1.0'; // For future schema migrations
    canvas: {
        width: number;
        height: number;
        backgroundColor: string;
    };
    elements: DesignElement[];
    metadata?: {
        title?: string;
        template?: string;
        theme?: string;
        createdAt?: string;
    };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateBlueprint(blueprint: any): blueprint is DesignBlueprint {
    if (!blueprint.canvas || !blueprint.elements) return false;
    if (typeof blueprint.canvas.width !== 'number') return false;
    if (typeof blueprint.canvas.height !== 'number') return false;
    if (!Array.isArray(blueprint.elements)) return false;

    // Validate each element has required fields
    for (const el of blueprint.elements) {
        if (!el.id || !el.type || !el.rect) return false;
        if (el.type === 'text' && !el.content) return false;
        if (el.type === 'image' && !el.src) return false;
    }

    return true;
}

// ============================================================================
// LAYOUT HELPERS (For AI to use)
// ============================================================================

/**
 * Common layout patterns the AI can reference
 */
export const LAYOUT_PATTERNS = {
    // Centered title at top
    heroTitle: (canvasWidth: number): Rect => ({
        x: 60,
        y: 200,
        width: canvasWidth - 120,
        height: 300
    }),

    // Subtitle below hero
    subtitle: (canvasWidth: number): Rect => ({
        x: 60,
        y: 520,
        width: canvasWidth - 120,
        height: 80
    }),

    // CTA button at bottom
    ctaButton: (canvasWidth: number, canvasHeight: number): Rect => ({
        x: (canvasWidth - 400) / 2,
        y: canvasHeight - 320,
        width: 400,
        height: 80
    }),

    // Full background image
    fullBackground: (canvasWidth: number, canvasHeight: number): Rect => ({
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight
    })
};

/**
 * Common color palettes the AI can use
 */
export const COLOR_PALETTES = {
    mysterious: {
        bg: '#0a0a0a',
        primary: '#FFFFFF',
        accent: '#8B5CF6',
        secondary: '#A78BFA'
    },
    energetic: {
        bg: '#000000',
        primary: '#00FF7F',
        accent: '#FF1493',
        secondary: '#FFD700'
    },
    professional: {
        bg: '#1e293b',
        primary: '#FFFFFF',
        accent: '#3b82f6',
        secondary: '#94a3b8'
    },
    warm: {
        bg: '#fef3c7',
        primary: '#78350f',
        accent: '#f59e0b',
        secondary: '#fbbf24'
    }
};
