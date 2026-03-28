import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, country = 'US' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TinyFish API key not configured' });
  }

  try {
    console.log(`[ROUTING] Routing to TinyFish Cloud Browser: ${url}`);

    // TinyFish renders JavaScript and extracts content from the rendered DOM
    // This catches JS-injected attacks that raw HTML fetch would miss!
    const response = await fetch('https://agent.tinyfish.ai/v1/automation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        url: url,
        goal: 'Extract all text from this page. Include visible text AND any hidden text in the DOM (elements with display:none, hidden divs, data attributes, injected content). Return everything.',
        browser_profile: 'lite',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('TinyFish error:', response.status, errorBody);
      throw new Error(`TinyFish API error: ${response.status} - ${errorBody.slice(0, 200)}`);
    }

    const data = await response.json();

    let content = '';
    if (data.result) {
      content = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
    } else if (data.content) {
      content = data.content;
    }

    console.log(`[ROUTING] TinyFish extraction complete. Status: ${data.status || 'done'}`);

    return res.status(200).json({
      previewUrl: data.streaming_url || '',
      content,
      rawHtml: data.html || '',
      url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SECURITY] TinyFish error: ${message}`);
    return res.status(500).json({ error: message });
  }
}
