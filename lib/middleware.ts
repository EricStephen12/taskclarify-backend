import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function authenticateRequest(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        let token = '';

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        } else {
            // Fallback to query parameter for browser redirects
            token = req.nextUrl.searchParams.get('token') || '';
        }

        if (!token) {
            console.error('[Auth] Token missing from request');
            return { authenticated: false, user: null };
        }

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('[Auth] Supabase environment variables are missing');
            return { authenticated: false, user: null };
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('[Auth] Supabase authentication failed:', error?.message);
            return { authenticated: false, user: null };
        }

        return { authenticated: true, user };
    } catch (err: any) {
        console.error('[Auth] Unhandled exception in middleware:', err.message);
        return { authenticated: false, user: null };
    }
}

export function unauthorizedResponse() {
    return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
    );
}
