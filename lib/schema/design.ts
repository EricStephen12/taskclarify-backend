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
    "poster": { width: 1080, height: 1920 },
    "flyer": { width: 816, height: 1056 },
    "magazine": { width: 2480, height: 3508 },    // High-res A4 Magazine
    "magazine_cover": { width: 1200, height: 1600 }, // Standard digital magazine
    "card": { width: 1500, height: 1050 },
    "birthday_card": { width: 1500, height: 1050 },
    "social": { width: 1080, height: 1080 },
    "instagram": { width: 1080, height: 1080 },
    "story": { width: 1080, height: 1920 },
    "banner": { width: 1920, height: 1080 },
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
    textShadow?: string;
    fontFamily?: string;
    rotation?: number; // Degrees (e.g., 90)
    transform?: string; // CSS-like transform string (legacy support)
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
    rotation?: number;
    gradient?: {
        colors: string[]; // ['#ff0000', '#0000ff']
        start?: { x: number; y: number };
        end?: { x: number; y: number };
    };
}

export interface ImageStyle {
    opacity?: number;
    borderRadius?: number;
    resizeMode?: 'cover' | 'contain' | 'stretch';
    rotation?: number;
    blur?: number; // Blur radius in pixels
    grayscale?: number; // 0-1
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
    // Grid: Left Column (1/3 width)
    leftColumn: (canvasHeight: number): Rect => ({
        x: 80,
        y: 80,
        width: 300,
        height: canvasHeight - 160
    }),

    // Grid: Right Column (last 1/3 width)
    rightColumn: (canvasWidth: number, canvasHeight: number): Rect => ({
        x: canvasWidth - 380,
        y: 80,
        width: 300,
        height: canvasHeight - 160
    }),

    // Lower-Third text block
    lowerThird: (canvasWidth: number, canvasHeight: number): Rect => ({
        x: 80,
        y: canvasHeight - 500,
        width: canvasWidth - 160,
        height: 300
    }),

    // Centered title at top
    heroTitle: (canvasWidth: number): Rect => ({
        x: 80,
        y: 120,
        width: canvasWidth - 160,
        height: 300
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
    midnight_gold: {
        bg: '#0F172A',
        primary: '#F1F5F9',
        accent: '#FACC15',
        secondary: '#EAB308'
    },
    organic_leaf: {
        bg: '#064e3b',
        primary: '#ecfdf5',
        accent: '#10b981',
        secondary: '#34d399'
    },
    neo_brutalist: {
        bg: '#facc15',
        primary: '#000000',
        accent: '#f472b6',
        secondary: '#fb923c'
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
