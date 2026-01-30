import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function authenticateRequest(req: NextRequest) {
    const authHeader = req.headers.get('authorization');

    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
    } else {
        // Fallback to query parameter for browser redirects
        token = req.nextUrl.searchParams.get('token') || '';
    }

    if (!token) {
        return { authenticated: false, user: null };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return { authenticated: false, user: null };
    }

    return { authenticated: true, user };
}

export function unauthorizedResponse() {
    return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
    );
}
