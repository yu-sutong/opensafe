import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory event store for SSE streaming
const events: Array<{ id: number; time: string; tag: string; message: string }> = [];
let eventId = 0;

export function addEvent(tag: string, message: string) {
  const event = {
    id: ++eventId,
    time: new Date().toLocaleTimeString('en-US'),
    tag,
    message,
  };
  events.push(event);
  // Keep only last 100 events
  if (events.length > 100) {
    events.shift();
  }
  return event;
}

// Export for use by other API routes
export { events };

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST to add events (internal use)
  if (req.method === 'POST') {
    const { tag, message } = req.body;
    if (tag && message) {
      const event = addEvent(tag, message);
      return res.status(200).json(event);
    }
    return res.status(400).json({ error: 'tag and message required' });
  }

  // GET for SSE stream
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send existing events
    for (const event of events) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    // For Vercel serverless, we can't keep connection open indefinitely
    // Client will poll or reconnect
    // Send a heartbeat and close
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', lastId: eventId })}\n\n`);
    return res.end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
