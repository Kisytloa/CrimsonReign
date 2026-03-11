export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'nope' });

  const { character, server = 'CE' } = req.query;
  if (!character) return res.status(400).json({ error: 'character manquant' });

  try {
    const url = `https://lostark.bible/character/${server}/${encodeURIComponent(character)}`;
    console.log(`Fetching: ${url}`);

    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Referer': 'https://lostark.bible/',
      }
    });

    console.log(`Status: ${r.status}`);
    if (!r.ok) return res.status(r.status).json({ error: `lostark.bible returned ${r.status}` });

    const html = await r.text();
    console.log(`HTML length: ${html.length}`);

    // Chercher les données JSON dans le HTML (Next.js __NEXT_DATA__ ou similar)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      const nextData = JSON.parse(nextDataMatch[1]);
      console.log('Found __NEXT_DATA__');
      return res.status(200).json({ source: 'next_data', data: nextData });
    }

    // Chercher window.__data__ ou similar
    const windowDataMatch = html.match(/window\.__(?:data|props|state)__\s*=\s*(\{[\s\S]*?\});/);
    if (windowDataMatch) {
      const data = JSON.parse(windowDataMatch[1]);
      return res.status(200).json({ source: 'window_data', data });
    }

    // Retourner les premiers 2000 chars pour debug
    return res.status(200).json({ 
      source: 'raw_html', 
      htmlPreview: html.substring(0, 2000),
      htmlLength: html.length
    });

  } catch(e) {
    console.error(`Error: ${e.message}`);
    return res.status(500).json({ error: e.message });
  }
}
