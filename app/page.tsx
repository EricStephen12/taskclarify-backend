export default function Home() {
    const diagnostics = {
        supabaseUrl: !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL),
        supabaseKey: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
        googleId: !!process.env.GOOGLE_CLIENT_ID,
        googleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        googleRedirect: !!process.env.GOOGLE_REDIRECT_URI,
        canvaId: !!process.env.CANVA_CLIENT_ID,
        canvaSecret: !!process.env.CANVA_CLIENT_SECRET,
        canvaRedirect: !!process.env.CANVA_REDIRECT_URI,
    };

    return (
        <main style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
            <h1>TaskClarify API</h1>
            <p>Backend is live and running.</p>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block', textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Environment Check</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {Object.entries(diagnostics).map(([key, present]) => (
                        <li key={key} style={{ marginBottom: '0.5rem', color: present ? '#059669' : '#dc2626' }}>
                            {present ? '✅' : '❌'} {key}: {present ? 'Detected' : 'MISSING'}
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    );
}
