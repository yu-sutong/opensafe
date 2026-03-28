import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory state for hackathon demo
let safeBrowseEnabled = false;

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ enabled: safeBrowseEnabled });
  }

  if (req.method === 'POST') {
    const { enabled } = req.body;
    if (typeof enabled === 'boolean') {
      safeBrowseEnabled = enabled;
    }
    return res.status(200).json({ enabled: safeBrowseEnabled });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
