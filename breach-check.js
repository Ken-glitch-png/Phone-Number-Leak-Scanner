// Vercel Serverless Function — proxies LeakCheck's public API server-side
// so the browser never has to make the cross-origin call directly (avoids CORS block).
// Deploy this file as-is inside an /api folder at your project root; Vercel picks it up
// automatically, no config needed.

export default async function handler(req, res) {
  const { check } = req.query;

  if (!check) {
    return res.status(400).json({ success: false, error: 'Missing "check" parameter' });
  }

  try {
    const upstream = await fetch(
      `https://leakcheck.io/api/public?check=${encodeURIComponent(check)}`,
      { headers: { Accept: 'application/json' } }
    );

    const data = await upstream.json();

    // Allow your own frontend to call this freely; cache briefly to ease rate limits.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(upstream.status).json(data);

  } catch (err) {
    return res.status(502).json({ success: false, error: 'Upstream request failed' });
  }
}
