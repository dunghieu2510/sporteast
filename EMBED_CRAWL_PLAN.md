# 🎬 Embed Crawler & Source Management Plan

**Purpose:** Crawl và quản lý embed URLs từ các website có cùng nội dung (livestreams) cho các trận đấu  
**Updated:** 2026-10-11

---

## I. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  EMBED CRAWLER SYSTEM                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  External Sources:                                      │
│  ├─ StreamEast.cool                                     │
│  ├─ Reddit Streams (r/nfl, r/nba, etc)                 │
│  ├─ Twitch Embeds                                       │
│  ├─ YouTube Embeds                                      │
│  └─ Official League Streams (ESPN, NFL.com, etc)       │
│                                                         │
│  ↓ (Crawl every 5-10 minutes)                          │
│                                                         │
│  Crawler Service (Node.js/Python)                       │
│  ├─ Detect embed URLs using selectors/regex            │
│  ├─ Validate & sanitize URLs                           │
│  ├─ Test stream accessibility                          │
│  └─ Store in database                                  │
│                                                         │
│  ↓                                                       │
│                                                         │
│  Database:                                              │
│  ├─ StreamEmbed table (multiple embeds per match)      │
│  ├─ EmbedSource table (track source URLs)              │
│  └─ EmbedLog table (crawl history)                     │
│                                                         │
│  ↓                                                       │
│                                                         │
│  API Endpoints:                                         │
│  ├─ GET /matches/{id}/embeds (return all sources)      │
│  ├─ GET /matches/{id}/embed/best (AI pick best one)    │
│  └─ POST /admin/embeds/test (validate URL)             │
│                                                         │
│  ↓                                                       │
│                                                         │
│  Frontend:                                              │
│  ├─ Show primary embed                                 │
│  ├─ Fallback to secondary if primary fails             │
│  └─ Allow user to switch between sources               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## II. Database Schema Changes

### **New Table: StreamEmbed**
```prisma
model StreamEmbed {
  id            String   @id @default(cuid())
  matchId       String
  sourceUrl     String   // Original page URL (e.g., streameast.cool/nfl)
  embedUrl      String   // Extracted embed URL (iframe src)
  embedType     String   // "iframe", "video-js", "hls", "m3u8"
  quality       String?  // "720p", "1080p", "4k"
  provider      String   // "streameast", "reddit", "twitch", "youtube"
  isWorking     Boolean  @default(true)
  lastTestedAt  DateTime?
  failureCount  Int      @default(0)
  priority      Int      @default(100) // Lower = higher priority
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  match Match @relation(fields: [matchId], references: [id], onDelete: Cascade)
  
  @@index([matchId, isWorking, priority])
  @@index([provider, createdAt])
}

model EmbedSource {
  id           String   @id @default(cuid())
  name         String   // "StreamEast", "Reddit", "Twitch", etc
  baseUrl      String   // https://streameast.cool/
  selector     String   // CSS selector for iframe: ".stream-embed iframe"
  regex        String?  // Fallback regex pattern
  isActive     Boolean  @default(true)
  crawlInterval Int    // Minutes (5, 10, 15, etc)
  lastCrawledAt DateTime?
  totalEmbeds  Int      @default(0)
  createdAt    DateTime @default(now())
}

model EmbedLog {
  id         String   @id @default(cuid())
  sourceId   String
  matchId    String?
  status     String   // "success", "failed", "timeout"
  embedCount Int      @default(0)
  errorMsg   String?
  duration   Int?     // ms taken
  createdAt  DateTime @default(now())
  
  @@index([sourceId, createdAt])
  @@index([status, createdAt])
}
```

---

## III. Crawler Implementation

### **Option 1: Node.js Crawler (Recommended)**

#### **Dependencies:**
```json
{
  "puppeteer": "^21.0.0",      // Browser automation
  "cheerio": "^1.0.0",         // HTML parsing
  "axios": "^1.6.0",           // HTTP requests
  "bull": "^4.0.0",            // Job queue
  "node-cache": "^5.0.0"       // Cache URLs
}
```

#### **Crawler Service** (`apps/api/src/crawler/crawler.service.ts`)
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as cheerio from 'cheerio';
import axios from 'axios';

@Injectable()
export class CrawlerService {
  private logger = new Logger('CrawlerService');
  private readonly TIMEOUT = 10000;

  constructor(private prisma: PrismaService) {}

  @Cron('*/5 * * * *') // Every 5 minutes
  async crawlAllSources() {
    const sources = await this.prisma.embedSource.findMany({
      where: { isActive: true }
    });

    for (const source of sources) {
      await this.crawlSource(source);
    }
  }

  async crawlSource(source: any) {
    const startTime = Date.now();
    let embedCount = 0;
    let status = 'success';
    let errorMsg: string | null = null;

    try {
      // 1. Fetch page HTML
      const { data: html } = await axios.get(source.baseUrl, {
        timeout: this.TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // 2. Parse HTML
      const $ = cheerio.load(html);

      // 3. Extract embeds using selector
      const embeds = new Set<string>();
      $(source.selector).each((_, elem) => {
        const src = $(elem).attr('src');
        if (src && this.isValidEmbed(src)) {
          embeds.add(src);
        }
      });

      // 4. Fallback: use regex if selector didn't work
      if (embeds.size === 0 && source.regex) {
        const regex = new RegExp(source.regex, 'g');
        let match;
        while ((match = regex.exec(html)) !== null) {
          if (match[1]) embeds.add(match[1]);
        }
      }

      embedCount = embeds.size;

      // 5. Match embeds to current live games
      const liveMatches = await this.prisma.match.findMany({
        where: { status: 'LIVE' }
      });

      // 6. Store embeds
      for (const match of liveMatches) {
        for (const embedUrl of embeds) {
          // Check if already exists
          const existing = await this.prisma.streamEmbed.findFirst({
            where: {
              matchId: match.id,
              embedUrl: embedUrl,
              provider: source.name
            }
          });

          if (!existing) {
            // Test embed before storing
            const isWorking = await this.testEmbed(embedUrl);
            
            await this.prisma.streamEmbed.create({
              data: {
                matchId: match.id,
                sourceUrl: source.baseUrl,
                embedUrl: embedUrl,
                embedType: this.detectEmbedType(embedUrl),
                provider: source.name,
                isWorking: isWorking,
                lastTestedAt: new Date()
              }
            });
          }
        }
      }

      this.logger.log(`✅ ${source.name}: Found ${embedCount} embeds`);

    } catch (error) {
      status = 'failed';
      errorMsg = error.message;
      this.logger.error(`❌ ${source.name}: ${error.message}`);
    }

    // Log crawl result
    await this.prisma.embedLog.create({
      data: {
        sourceId: source.id,
        status,
        embedCount,
        errorMsg,
        duration: Date.now() - startTime
      }
    });

    // Update source
    await this.prisma.embedSource.update({
      where: { id: source.id },
      data: {
        lastCrawledAt: new Date(),
        totalEmbeds: embedCount
      }
    });
  }

  async testEmbed(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      return response.status < 400;
    } catch {
      return false;
    }
  }

  isValidEmbed(url: string): boolean {
    const invalidPatterns = ['javascript:', 'data:', 'blob:'];
    return !invalidPatterns.some(pattern => url.startsWith(pattern));
  }

  detectEmbedType(url: string): string {
    if (url.includes('twitch.tv')) return 'iframe';
    if (url.includes('youtube.com')) return 'iframe';
    if (url.includes('m3u8')) return 'm3u8';
    if (url.includes('hls')) return 'hls';
    return 'iframe';
  }
}
```

---

### **Crawl Configuration** (`apps/api/src/crawler/sources.ts`)

```typescript
export const EMBED_SOURCES = [
  {
    name: 'StreamEast',
    baseUrl: 'https://streameast.cool/',
    selector: '.stream-embed iframe',        // Adjust based on site
    regex: 'src=["\']([^"\']+)["\']',
    crawlInterval: 5,
    enabled: true
  },
  {
    name: 'Reddit Streams (r/nfl)',
    baseUrl: 'https://reddit.com/r/nfl/',
    selector: 'iframe[src*="reddit"]',
    crawlInterval: 10,
    enabled: true
  },
  {
    name: 'Twitch',
    baseUrl: 'https://www.twitch.tv/directory/category/',
    selector: 'iframe[src*="twitch.tv"]',
    crawlInterval: 15,
    enabled: true
  },
  {
    name: 'YouTube',
    baseUrl: 'https://www.youtube.com/',
    selector: 'iframe[src*="youtube.com"]',
    crawlInterval: 15,
    enabled: true
  },
  {
    name: 'ESPN',
    baseUrl: 'https://www.espn.com/',
    selector: '.video-container iframe, iframe[src*="espn"]',
    crawlInterval: 5,
    enabled: true
  }
];
```

---

## IV. API Endpoints

### **1. Get All Embeds for Match**
```typescript
@Get('/matches/:matchId/embeds')
async getMatchEmbeds(@Param('matchId') matchId: string) {
  return await this.prisma.streamEmbed.findMany({
    where: { matchId },
    orderBy: [
      { isWorking: 'desc' },
      { priority: 'asc' },
      { createdAt: 'desc' }
    ]
  });
}
```

**Response:**
```json
{
  "embeds": [
    {
      "id": "embed_123",
      "embedUrl": "https://streameast.cool/nfl/kansas-city",
      "provider": "StreamEast",
      "quality": "720p",
      "isWorking": true,
      "priority": 50
    },
    {
      "id": "embed_456",
      "embedUrl": "https://reddit.com/embed/...",
      "provider": "Reddit",
      "quality": "480p",
      "isWorking": true,
      "priority": 100
    }
  ]
}
```

### **2. Get Best Working Embed**
```typescript
@Get('/matches/:matchId/embed/best')
async getBestEmbed(@Param('matchId') matchId: string) {
  const best = await this.prisma.streamEmbed.findFirst({
    where: { 
      matchId,
      isWorking: true
    },
    orderBy: { priority: 'asc' }
  });
  
  return best || null;
}
```

### **3. Test/Validate Embed (Admin)**
```typescript
@Post('/admin/embeds/:embedId/test')
@UseGuards(AdminGuard)
async testEmbed(@Param('embedId') embedId: string) {
  const embed = await this.prisma.streamEmbed.findUnique({
    where: { id: embedId }
  });

  const isWorking = await this.crawlerService.testEmbed(embed.embedUrl);

  await this.prisma.streamEmbed.update({
    where: { id: embedId },
    data: {
      isWorking,
      lastTestedAt: new Date(),
      failureCount: isWorking ? 0 : embed.failureCount + 1
    }
  });

  return { isWorking };
}
```

### **4. Manually Add Embed**
```typescript
@Post('/admin/embeds')
@UseGuards(AdminGuard)
async addEmbed(@Body() data: CreateEmbedDto) {
  const isWorking = await this.crawlerService.testEmbed(data.embedUrl);

  return await this.prisma.streamEmbed.create({
    data: {
      matchId: data.matchId,
      sourceUrl: data.sourceUrl,
      embedUrl: data.embedUrl,
      embedType: this.crawlerService.detectEmbedType(data.embedUrl),
      provider: data.provider || 'custom',
      isWorking,
      lastTestedAt: new Date()
    }
  });
}
```

---

## V. Frontend Implementation

### **Update Match Detail Page**

```typescript
// app/match/[slug]/page.tsx

import { Suspense } from 'react';

export default async function MatchPage({ params }: Props) {
  const { data: match } = await getMatch(slug);

  return (
    <div>
      {/* Scoreboard, etc */}
      <Player matchId={match.id} />
    </div>
  );
}

function Player({ matchId }: { matchId: string }) {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <PlayerContent matchId={matchId} />
    </Suspense>
  );
}

async function PlayerContent({ matchId }: { matchId: string }) {
  // Fetch best embed for this match
  const embed = await fetch(
    `${API_URL}/api/matches/${matchId}/embed/best`
  ).then(r => r.json());

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
      {embed?.embedUrl ? (
        <EmbedViewer embed={embed} matchId={matchId} />
      ) : (
        <NoStreamsAvailable matchId={matchId} />
      )}
    </div>
  );
}

// Client component for interactivity
'use client';

import { useEffect, useState } from 'react';

interface Embed {
  id: string;
  embedUrl: string;
  provider: string;
  quality?: string;
  isWorking: boolean;
  priority: number;
}

function EmbedViewer({ embed, matchId }: { embed: Embed; matchId: string }) {
  const [allEmbeds, setAllEmbeds] = useState<Embed[]>([embed]);
  const [currentEmbed, setCurrentEmbed] = useState(embed);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load all available embeds
    fetch(`/api/matches/${matchId}/embeds`)
      .then(r => r.json())
      .then(data => setAllEmbeds(data.embeds))
      .catch(console.error);
  }, [matchId]);

  const switchEmbed = (newEmbed: Embed) => {
    setLoading(true);
    setCurrentEmbed(newEmbed);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Embed iframe */}
      <div className="relative flex-1 bg-black">
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="spinner" />
          </div>
        )}
        
        <iframe
          key={currentEmbed.id}
          src={currentEmbed.embedUrl}
          title={`${currentEmbed.provider} stream`}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Embed switcher */}
      {allEmbeds.length > 1 && (
        <div className="bg-night-800 border-t border-white/10 p-3 flex gap-2 overflow-x-auto">
          {allEmbeds.map((e) => (
            <button
              key={e.id}
              onClick={() => switchEmbed(e)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                e.id === currentEmbed.id
                  ? 'bg-neon text-night-950'
                  : e.isWorking
                  ? 'border border-white/20 text-white hover:border-white/40'
                  : 'border border-red-500/30 text-red-400'
              }`}
            >
              {e.provider}
              {e.quality && ` ${e.quality}`}
              {!e.isWorking && ' (⚠️)'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NoStreamsAvailable({ matchId }: { matchId: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="text-4xl mb-4">📡</div>
      <p className="text-center text-muted">
        No streams available yet.<br />
        Check back in a few minutes!
      </p>
    </div>
  );
}
```

---

## VI. Admin Dashboard

### **New Admin Page: Embed Management** (`/admin/embeds`)

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function AdminEmbeds() {
  const [sources, setSources] = useState([]);
  const [embeds, setEmbeds] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Fetch sources, embeds, logs
    Promise.all([
      fetch('/api/admin/embed-sources').then(r => r.json()),
      fetch('/api/admin/embeds').then(r => r.json()),
      fetch('/api/admin/embed-logs?limit=20').then(r => r.json())
    ]).then(([sources, embeds, logs]) => {
      setSources(sources);
      setEmbeds(embeds);
      setLogs(logs);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Embed Sources */}
      <section className="glass rounded-2xl p-6">
        <h2 className="font-display text-2xl font-bold mb-4">Embed Sources</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3">Source</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Last Crawled</th>
              <th className="text-left p-3">Total Embeds</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id} className="border-b border-white/5">
                <td className="p-3 font-semibold">{source.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    source.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {source.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-sm text-muted">
                  {new Date(source.lastCrawledAt).toLocaleDateString()}
                </td>
                <td className="p-3">{source.totalEmbeds}</td>
                <td className="p-3 flex gap-2">
                  <button className="px-3 py-1 text-xs rounded bg-neon/20 text-neon hover:bg-neon/30">
                    Crawl Now
                  </button>
                  <button className="px-3 py-1 text-xs rounded border border-white/20 text-white hover:border-white/40">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Embed Quality Stats */}
      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard 
          label="Total Embeds" 
          value={embeds.length}
          icon="📡"
        />
        <StatCard 
          label="Working" 
          value={embeds.filter(e => e.isWorking).length}
          icon="✅"
        />
        <StatCard 
          label="Broken" 
          value={embeds.filter(e => !e.isWorking).length}
          icon="❌"
        />
        <StatCard 
          label="Success Rate" 
          value={`${((embeds.filter(e => e.isWorking).length / embeds.length) * 100).toFixed(0)}%`}
          icon="📊"
        />
      </section>

      {/* Crawl Logs */}
      <section className="glass rounded-2xl p-6">
        <h2 className="font-display text-2xl font-bold mb-4">Recent Crawl Logs</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-sm p-3 hover:bg-white/5 rounded">
              <div className="flex items-center gap-3">
                <span className={`${log.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {log.status === 'success' ? '✅' : '❌'}
                </span>
                <span className="font-semibold">{log.sourceId}</span>
                <span className="text-muted">{log.embedCount} embeds</span>
              </div>
              <div className="text-muted">{log.duration}ms</div>
              <time className="text-muted text-xs">
                {new Date(log.createdAt).toLocaleTimeString()}
              </time>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

## VII. Health Checks & Fallbacks

### **Periodic Health Check**
```typescript
@Cron('*/2 * * * *') // Every 2 minutes
async checkEmbedHealth() {
  const embeds = await this.prisma.streamEmbed.findMany({
    where: {
      isWorking: true,
      match: { status: 'LIVE' }
    }
  });

  for (const embed of embeds) {
    const isWorking = await this.testEmbed(embed.embedUrl);
    
    if (!isWorking) {
      await this.prisma.streamEmbed.update({
        where: { id: embed.id },
        data: {
          isWorking: false,
          failureCount: { increment: 1 }
        }
      });
    }
  }
}

// Auto-disable after 5 failures
@Cron('0 * * * *') // Every hour
async cleanupFailedEmbeds() {
  await this.prisma.streamEmbed.updateMany({
    where: { failureCount: { gte: 5 } },
    data: { isWorking: false }
  });
}
```

---

## VIII. Legal & Ethical Considerations

### **⚖️ Important Compliance**

1. **Terms of Service**
   - ✅ Crawl only public, non-protected content
   - ✅ Respect robots.txt
   - ✅ Don't overload servers (reasonable rate limits)
   - ❌ Don't bypass authentication or paywalls

2. **Copyright**
   - ✅ Use official embeds (ESPN, NFL.com, etc.)
   - ⚠️ User-generated streams (Reddit, StreamEast) - gray area
   - ❌ Don't re-encode or modify streams

3. **Rate Limiting**
   - ✅ Crawl every 5-15 minutes (not every second)
   - ✅ Cache results to reduce requests
   - ✅ Respect API limits

4. **Disclaimer**
   - Add to website: *"Some streams may be user-generated or third-party content. We do not claim rights to this content."*

---

## IX. Testing Strategy

```typescript
// Test crawler with mock data
describe('CrawlerService', () => {
  it('should extract embeds from HTML', async () => {
    const html = `<iframe src="https://example.com/stream"></iframe>`;
    const embeds = extractEmbeds(html, 'iframe[src]');
    expect(embeds).toContain('https://example.com/stream');
  });

  it('should detect embed type correctly', () => {
    expect(detectEmbedType('https://twitch.tv/...')).toBe('iframe');
    expect(detectEmbedType('https://example.m3u8')).toBe('m3u8');
  });

  it('should test embed accessibility', async () => {
    const isWorking = await testEmbed('https://valid-stream.com');
    expect(typeof isWorking).toBe('boolean');
  });
});
```

---

## X. Deployment Checklist

- [ ] Add crawler dependencies (puppeteer, cheerio, axios, bull)
- [ ] Create Prisma migration for StreamEmbed, EmbedSource, EmbedLog tables
- [ ] Implement CrawlerService with @Cron jobs
- [ ] Create API endpoints (/api/matches/{id}/embeds, etc)
- [ ] Update Match detail page to show embeds
- [ ] Create admin embed management page
- [ ] Set up embed source configurations
- [ ] Test crawlers with real websites
- [ ] Add health check & fallback logic
- [ ] Add rate limiting & monitoring
- [ ] Deploy with Docker (separate crawler service optional)

---

## XI. Estimated Costs & Resources

| Component | Time | Resources |
|-----------|------|-----------|
| Database schema | 1 day | SQL |
| Crawler service | 3 days | Node.js, Puppeteer |
| API endpoints | 1 day | NestJS |
| Frontend integration | 2 days | React |
| Admin dashboard | 1 day | Next.js |
| Testing & deployment | 2 days | Jest, Docker |
| **Total** | **~10 days** | - |

---

## XII. Alternative Approach: Official APIs

Instead of crawling, consider official APIs:

| Source | API | Auth | Cost |
|--------|-----|------|------|
| Twitch | Yes | OAuth | Free (rate limited) |
| YouTube | Yes | API key | Free |
| ESPN | No | - | N/A |
| Reddit | Yes | OAuth | Free |
| NFL.com | Limited | - | Partial |

---

**Status:** Plan Ready for Implementation  
**Complexity:** Medium (requires DevOps + backend optimization)  
**ROI:** High (multiple fallback streams = better reliability)

