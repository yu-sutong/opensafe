import type { VercelRequest, VercelResponse } from '@vercel/node';

interface OpenAIMessage {
  role: string;
  content: string;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface ProxyState {
  enabled: boolean;
}

interface ScrapeResult {
  previewUrl: string;
  content: string;
  rawHtml: string;
  url: string;
}

interface SanitizeResult {
  sanitized_content: string;
  threats_detected: Array<{
    type: string;
    original: string;
    location: string;
  }>;
  risk_level: string;
  latency_ms: number;
}

// Event storage for dashboard
const eventLog: Array<{ time: string; tag: string; message: string }> = [];
let stats = {
  threatsNeutralized: 0,
  extractions: 0,
  totalLatency: 0,
  requestCount: 0,
};

function addEvent(tag: string, message: string) {
  const event = {
    time: new Date().toLocaleTimeString('en-US'),
    tag,
    message,
  };
  eventLog.push(event);
  if (eventLog.length > 100) eventLog.shift();
  return event;
}

// Check if this is a web-related tool call
function isWebToolCall(toolName: string): boolean {
  const webTools = ['web_fetch', 'browser', 'fetch_url', 'get_webpage', 'browse', 'scrape'];
  return webTools.some(t => toolName.toLowerCase().includes(t));
}

// Extract URL from tool arguments
function extractUrl(args: string): string | null {
  try {
    const parsed = JSON.parse(args);
    return parsed.url || parsed.href || parsed.target || null;
  } catch {
    // Try regex for URL
    const urlMatch = args.match(/https?:\/\/[^\s"']+/);
    return urlMatch ? urlMatch[0] : null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET request returns stats and events for dashboard
  if (req.method === 'GET') {
    return res.status(200).json({
      events: eventLog,
      stats: {
        threatsNeutralized: stats.threatsNeutralized,
        extractions: stats.extractions,
        avgLatency: stats.requestCount > 0
          ? (stats.totalLatency / stats.requestCount / 1000).toFixed(1) + 's'
          : '0.0s',
      },
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const baseUrl = getBaseUrl(req);

  try {
    // Check SafeBrowse state
    const stateRes = await fetch(`${baseUrl}/api/state`);
    const stateData: ProxyState = await stateRes.json();

    if (!stateData.enabled) {
      // Passthrough mode - forward directly to OpenAI
      addEvent('INBOUND', 'Request received (SafeBrowse OFF - passthrough mode)');
      return await passthroughToOpenAI(req, res);
    }

    // SafeBrowse is ON - intercept and process
    const body = req.body;
    addEvent('INBOUND', `Request intercepted: ${body.model || 'unknown model'}`);

    // Check for tool calls in the messages
    const messages: OpenAIMessage[] = body.messages || [];
    const lastMessage = messages[messages.length - 1];

    // Look for web-related tool calls
    let webUrls: string[] = [];

    if (lastMessage?.tool_calls) {
      for (const call of lastMessage.tool_calls) {
        if (isWebToolCall(call.function.name)) {
          const url = extractUrl(call.function.arguments);
          if (url) webUrls.push(url);
        }
      }
    }

    // Also check message content for URL fetch patterns
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        // Check for patterns like "fetch https://..." or "browse to https://..."
        const urlMatches = msg.content.match(/(?:fetch|browse|visit|go to|navigate to|open)\s+(https?:\/\/[^\s]+)/gi);
        if (urlMatches) {
          for (const match of urlMatches) {
            const url = match.match(/https?:\/\/[^\s]+/)?.[0];
            if (url) webUrls.push(url);
          }
        }
      }
    }

    if (webUrls.length === 0) {
      // No web URLs detected, passthrough
      addEvent('ROUTING', 'No web requests detected, passing through');
      return await passthroughToOpenAI(req, res);
    }

    // Process each URL through SafeBrowse pipeline
    addEvent('ROUTING', `Intercepted ${webUrls.length} web request(s): ${webUrls.join(', ')}`);

    let allSanitizedContent = '';
    let allThreats: Array<{ type: string; original: string; location: string }> = [];
    let totalLatency = 0;

    for (const url of webUrls) {
      addEvent('ROUTING', `Routing to TinyFish Cloud Browser: ${url}`);
      stats.extractions++;

      // Call TinyFish scraper
      const scrapeRes = await fetch(`${baseUrl}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!scrapeRes.ok) {
        addEvent('SECURITY', `TinyFish scrape failed for ${url}`);
        continue;
      }

      const scrapeData: ScrapeResult = await scrapeRes.json();
      addEvent('ROUTING', `TinyFish extraction complete for ${url}`);

      // Call OpenAI sanitizer
      addEvent('SECURITY', `Sending to OpenAI for threat analysis...`);

      const sanitizeRes = await fetch(`${baseUrl}/api/sanitize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: scrapeData.content || scrapeData.rawHtml,
          url,
        }),
      });

      if (!sanitizeRes.ok) {
        addEvent('SECURITY', `Sanitization failed for ${url}`);
        continue;
      }

      const sanitizeData: SanitizeResult = await sanitizeRes.json();
      totalLatency += sanitizeData.latency_ms;

      if (sanitizeData.threats_detected.length > 0) {
        stats.threatsNeutralized += sanitizeData.threats_detected.length;
        addEvent('SECURITY', `ALERT: ${sanitizeData.threats_detected.length} threat(s) detected! Risk: ${sanitizeData.risk_level}`);

        for (const threat of sanitizeData.threats_detected) {
          addEvent('SECURITY', `Stripped ${threat.type}: "${threat.original.substring(0, 50)}..."`);
        }

        allThreats = [...allThreats, ...sanitizeData.threats_detected];
      } else {
        addEvent('SECURITY', `No threats detected for ${url}`);
      }

      allSanitizedContent += `\n\n--- Content from ${url} ---\n${sanitizeData.sanitized_content}`;
    }

    // Update stats
    stats.totalLatency += totalLatency;
    stats.requestCount++;

    addEvent('OUTBOUND', 'Clean, sanitized data returned to agent');

    // Modify the request to include sanitized content and forward to OpenAI
    const modifiedMessages = [...messages];

    // Add sanitized content as a system message
    if (allSanitizedContent) {
      modifiedMessages.push({
        role: 'system',
        content: `[SafeBrowse] The following web content has been fetched and sanitized for security:\n${allSanitizedContent}`,
      });
    }

    // Forward modified request to OpenAI
    return await passthroughToOpenAI(req, res, { ...body, messages: modifiedMessages });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    addEvent('SECURITY', `Error: ${message}`);
    return res.status(500).json({ error: message });
  }
}

async function passthroughToOpenAI(
  req: VercelRequest,
  res: VercelResponse,
  body?: object
) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify(body || req.body),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

function getBaseUrl(req: VercelRequest): string {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}
