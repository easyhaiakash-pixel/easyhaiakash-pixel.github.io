// Opens an Amazon SHORT link (amzn.to, amzn.in/d/..., a.co, link.amazon ...) and returns the full Amazon link.
// Used by src/giftlink.js. Only Amazon short-link hosts are allowed in, and only Amazon pages come out.
const SHORT = /^(amzn\.to|amzn\.in|amzn\.eu|amzn\.asia|a\.co|link\.amazon|amzlinks\.in|amzlink\.to)$/i;
const AMAZON = /(^|\.)amazon\.(com|in|co\.uk|de|fr|it|es|ca|com\.au|co\.jp|ae|sa|nl|se|pl|sg|com\.br|com\.mx|com\.tr)$/i;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  let u;
  try { u = new URL(String((req.query && req.query.u) || '')); } catch (e) { return res.status(400).json({ error: 'bad link' }); }
  if (!SHORT.test(u.hostname.replace(/^www\./, ''))) return res.status(400).json({ error: 'not an Amazon short link' });
  try {
    for (let hop = 0; hop < 6; hop++) {
      const r = await fetch(u.href, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AthenaHome/1.0)', 'Accept-Language': 'en' } });
      const loc = r.headers.get('location');
      if (r.status >= 300 && r.status < 400 && loc) {
        u = new URL(loc, u);
        const h = u.hostname.replace(/^(www|m|smile)\./, '');
        if (AMAZON.test(h)) return res.status(200).json({ url: u.href });
        if (!SHORT.test(h)) return res.status(400).json({ error: 'not an Amazon link' });
        continue;
      }
      return res.status(404).json({ error: 'link did not open' });
    }
    return res.status(404).json({ error: 'too many hops' });
  } catch (e) { return res.status(502).json({ error: 'could not open link' }); }
};
