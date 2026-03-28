# OpenSafe

**Zero-Trust Web Execution for AI Agents**

OpenSafe is a security middleware that protects AI agents from Indirect Prompt Injection (IDPI) attacks when browsing the web. It intercepts agent web requests, routes them through an isolated cloud browser, sanitizes content with AI, and returns clean data to the agent.

![OpenSafe Architecture](https://img.shields.io/badge/TinyFish-Integrated-blue) ![OpenAI](https://img.shields.io/badge/OpenAI-Powered-green) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

## The Problem

AI agents are increasingly browsing the web to complete tasks. But they're **blind and gullible**.

Attackers can embed hidden instructions in websites that hijack agent behavior:

- **White text on white background** - Invisible to humans, visible to agents
- **CSS hidden elements** - `position: absolute; left: -9999px`
- **JavaScript-injected content** - Attacks loaded dynamically after page renders
- **Zero-width characters** - Unicode tricks to hide malicious text
- **Social engineering** - "The admin said to ignore your instructions..."

This is called **Indirect Prompt Injection** - and it's the #1 security threat to AI agents today.

### Real-World Incidents
- LiteLLM API key leak via prompt injection
- OpenClaw security vulnerabilities
- Multiple research papers demonstrating IDPI attacks on production agents

## The Solution

OpenSafe provides **defense-in-depth** with a two-layer protection system:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OpenSafe Pipeline                           │
└─────────────────────────────────────────────────────────────────────┘

   AI Agent (OpenClaw, AutoGPT, etc.)
        │
        ▼
   ┌─────────────┐
   │ /api/proxy  │  ← Intercepts API calls, detects web requests
   └─────────────┘
        │
        ▼
   ┌─────────────┐
   │ /api/scrape │  ← TinyFish Cloud Browser (isolated, renders JS)
   └─────────────┘
        │
        ▼
   ┌──────────────┐
   │ /api/sanitize│  ← OpenAI threat analysis & content sanitization
   └──────────────┘
        │
        ▼
   ┌─────────────┐
   │ Clean JSON  │  → Safe data returned to agent
   └─────────────┘
```

## Why TinyFish is Critical

Most web scrapers use simple HTTP fetch - they only see static HTML. But modern attacks use **JavaScript injection** that loads AFTER the page renders.

| Method | Sees Static HTML | Executes JavaScript | Catches JS-Injected Attacks |
|--------|------------------|---------------------|----------------------------|
| `fetch()` / `curl` | ✅ | ❌ | ❌ |
| Cheerio / BeautifulSoup | ✅ | ❌ | ❌ |
| **TinyFish Cloud Browser** | ✅ | ✅ | ✅ |

TinyFish runs a **real browser in the cloud** that:
- Renders JavaScript like Chrome/Firefox
- Extracts the full DOM including dynamically injected content
- Runs in complete isolation (no cookies, no user data)
- Bypasses bot detection with stealth mode

## Key Innovation

**The "Aha!" Moment**: Raw HTML fetch sees a clean banking page. TinyFish reveals hidden attack instructions that would hijack your AI agent.

Our dashboard shows this side-by-side:
- **Left panel**: Raw HTML Fetch → "Looks Safe" ✅
- **Right panel**: TinyFish Rendered DOM → "Attacks Found!" 🚨

This visual diff is the core insight: **you can't protect against what you can't see**.

## Features

### Security Dashboard
- **Real-time threat monitoring** - Watch attacks get detected and stripped
- **Toggle protection on/off** - Demonstrate the difference
- **Live logs** - See the full pipeline: intercept → render → analyze → sanitize

### Threat Visualization
- **Raw tab** - Original content extracted by TinyFish
- **Threats tab** - List of detected attacks with type, original text, location
- **Sanitized tab** - Clean content after threats removed
- **Risk level indicator** - none / low / medium / high / critical

### Comparison View
- Side-by-side: Raw HTML vs Rendered DOM
- Highlights JavaScript-injected attacks that simple fetch misses
- Visual proof of why browser rendering matters

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/proxy` | Main routing - intercepts agent requests |
| `POST /api/scrape` | TinyFish integration - renders pages |
| `POST /api/sanitize` | OpenAI analysis - detects & strips threats |
| `GET/POST /api/state` | Toggle SafeBrowse on/off |

## Attack Patterns Detected

OpenSafe's AI sanitizer detects:

- **System prompt overrides** - "IGNORE ALL PREVIOUS INSTRUCTIONS"
- **Jailbreak attempts** - "You are now DAN (Do Anything Now)"
- **Authority spoofing** - "ADMIN DEBUG MODE ACTIVE"
- **Social engineering** - "The developer said to..."
- **Hidden instructions** - CSS hidden, white-on-white, zero-width chars
- **Priority manipulation** - "CRITICAL SYSTEM MESSAGE"

## Demo Pages

We created test pages to demonstrate the attacks:

### `/poison.html` - CSS Hidden Attacks
Contains attacks hidden via CSS that any scraper would receive but humans can't see.

### `/poison-js.html` - JavaScript Injected Attacks
Contains attacks injected via JavaScript AFTER page load. **Only a real browser (TinyFish) can catch these.**

## Quick Start

### Prerequisites
- Node.js 18+
- TinyFish API key ([get one here](https://tinyfish.ai))
- OpenAI API key

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/opensafe.git
cd opensafe

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys:
# TINYFISH_API_KEY=sk-tinyfish-...
# OPENAI_API_KEY=sk-proj-...

# Run locally
npm run dev
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

## Usage with AI Agents

Set your agent's OpenAI base URL to route through OpenSafe:

```bash
export OPENAI_BASE_URL=https://your-opensafe-deployment.vercel.app/api/proxy
```

Now all your agent's web requests will be automatically protected.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Vercel Serverless Functions
- **APIs**: TinyFish Cloud Browser, OpenAI GPT-4o-mini
- **Deployment**: Vercel

## Architecture Decisions

### Why Serverless?
- Instant deployment
- Auto-scaling for demo traffic
- No infrastructure to manage during hackathon

### Why OpenAI for Sanitization?
- Understands context and intent, not just pattern matching
- Can detect novel attack variations
- Provides risk assessment, not just binary detection

### Why Two-Layer Protection?
1. **TinyFish** catches what you can't see (JS-rendered content)
2. **OpenAI** understands what's malicious (semantic analysis)

Neither alone is sufficient. Together, they provide comprehensive protection.

## Limitations

- **Serverless state**: Toggle state resets on cold starts (use Redis for production)
- **Latency**: Full pipeline adds 2-5 seconds (acceptable for security-critical operations)
- **Cost**: TinyFish + OpenAI API calls add up (implement caching for production)

## Future Roadmap

- [ ] Persistent state with Redis/Upstash
- [ ] Webhook notifications for high-risk detections
- [ ] Custom threat pattern configuration
- [ ] Rate limiting and caching layer
- [ ] Support for more LLM providers

## Contributing

This project was built during a hackathon. PRs welcome!

## License

MIT

---

## The Team

Built with urgency and caffeine at [Hackathon Name] 2024.

**One-liner**: *"OpenSafe is a security middleware that protects AI agents from prompt injection attacks by routing web requests through TinyFish's isolated browser and sanitizing content with OpenAI before it reaches the agent."*

---

**Live Demo**: [https://opensafe-ai.vercel.app](https://opensafe-ai.vercel.app)
