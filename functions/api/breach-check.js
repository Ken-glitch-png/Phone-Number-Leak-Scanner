// Cloudflare Pages Function — proxies LeakCheck's public API server-side
// so the browser never has to make the cross-origin call directly (avoids CORS block).
//
// File location matters for routing: this file must live at
//   /functions/api/breach-check.js
// Cloudflare Pages auto-maps that path to the route /api/breach-check — no config needed.

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
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
