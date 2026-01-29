import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const FREE_LIMIT = 5;

export async function GET(req: NextRequest) {
    const { authenticated, user } = await authenticateRequest(req);
    if (!authenticated || !user) return unauthorizedResponse();

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    const { data, error } = await supabase
        .from('usage_tracking')
        .select('count')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
    }

    const used = data?.count || 0;
    const remaining = Math.max(0, FREE_LIMIT - used);

    return NextResponse.json({
        used,
        limit: FREE_LIMIT,
        remaining
    });
}

export async function POST(req: NextRequest) {
    const { authenticated, user } = await authenticateRequest(req);
    if (!authenticated || !user) return unauthorizedResponse();

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    const { data: current } = await supabase
        .from('usage_tracking')
        .select('count')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

    const newCount = (current?.count || 0) + 1;

    const { error } = await supabase
        .from('usage_tracking')
        .upsert({
            user_id: user.id,
            month: currentMonth,
            count: newCount
        }, { onConflict: 'user_id,month' });

    if (error) {
        return NextResponse.json({ error: 'Failed to update usage' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: newCount });
}
