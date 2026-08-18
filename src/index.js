// Cloudflare Worker entry point.
// Handles the /api/breach-check proxy route, and hands everything else
// off to the static assets binding (your index.html and other files in /public).

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/breach-check') {
      const check = url.searchParams.get('check');

      if (!check) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing "check" parameter' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const upstream = await fetch(
          `https://leakcheck.io/api/public?check=${encodeURIComponent(check)}`,
          { headers: { Accept: 'application/json' } }
        );

        const data = await upstream.json();

        return new Response(JSON.stringify(data), {
          status: upstream.status,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
          },
        });

      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: 'Upstream request failed' }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Everything else (index.html, etc.) is served from the static assets binding
    return env.ASSETS.fetch(request);
  },
};
