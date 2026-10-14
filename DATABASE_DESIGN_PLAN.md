# 📊 Arena Database Design Plan

**Website:** Live Sports Streaming Platform  
**Database:** PostgreSQL 16  
**ORM:** Prisma  
**Date:** 2026-10-11  

---

## I. Database Overview

### Key Statistics
- **Total Tables:** 19 models (removed ChatMessage)
- **Total Relationships:** 24+ foreign keys
- **Key Enums:** 8 (Role, MatchStatus, MatchEventType, etc.)
- **Indexes:** Optimized for queries (status, timestamp, relationships)

---

## II. Core Tables (15 Existing + 5 SEO New)

### 📋 Table Structure

```
┌─────────────────────────────────────────────────────────┐
│                    ARENA DATABASE                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐      ┌──────────────┐               │
│  │   Users      │◄─────┤  Channels    │               │
│  │ (ID, email)  │      │ (creator)    │               │
│  └──────────────┘      └──────────────┘               │
│        │                     │                         │
│        ├──────────────────┐  │                         │
│        │                  │  │                         │
│  ┌──────────────────┐  ┌──────────────┐              │
│  │ ChatMessages     │  │   Streams    │              │
│  │ Predictions      │  │ (live video) │              │
│  │ Reports          │  └──────────────┘              │
│  │ Follows          │        │                       │
│  └──────────────────┘        ├─────────┬──────────┐  │
│                              │         │          │  │
│                       ┌──────────┐  ┌─────┐  ┌─────────┐
│                       │   VODs   │  │Msgs │  │DMCA Req│
│                       └──────────┘  └─────┘  └─────────┘
│
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  │   Sports     │  │   Leagues    │  │    Teams     │
│  └──────────────┘  └──────────────┘  └──────────────┘
│        │                  │                    │
│        └──────────────────┴────────────────────┘
│                         │
│                    ┌────────────┐
│                    │  Matches   │
│                    └────────────┘
│                         │
│            ┌────────────┼────────────┐
│            │            │            │
│       ┌─────────┐  ┌─────────┐  ┌─────────┐
│       │  Events │  │Streams  │  │Highlights
│       │         │  │linked   │  │
│       └─────────┘  └─────────┘  └─────────┘
│
│  SEO MANAGEMENT TABLES:
│  ┌──────────────────────────────────────┐
│  │ - SeoMetaTag                         │
│  │ - SeoSchemaMarkup                    │
│  │ - SeoKeyword                         │
│  │ - SeoRedirect                        │
│  │ - SeoAuditLog                        │
│  └──────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────┘
```

---

## III. Detailed Table Specifications

### A. User Management

#### 1. **User** (Người dùng)
```prisma
model User {
  id          String       @id @default(cuid())
  email       String       @unique
  username    String       @unique
  avatarUrl   String?
  role        Role         @default(VIEWER)        // VIEWER, CREATOR, MODERATOR, ADMIN
  isActive    Boolean      @default(true)
  isBanned    Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  // Relations
  channel     Channel?
  follows     Follow[]
  predictions Prediction[]
  reports     Report[]
}
```
**Indexes:** email, username, role, isBanned  
**Purpose:** Authentication, authorization, user profiles

---

### B. Sports & Competitions

#### 2. **Sport** (Thể thao)
```prisma
model Sport {
  id      String   @id @default(cuid())
  name    String        // "NFL", "NBA", "NHL"
  slug    String   @unique
  icon    String?       // emoji hoặc URL
  leagues League[]
}
```
**Data:**
- NFL, NBA, NHL, MLB, Soccer, WNBA, NCAAF, MMA

---

#### 3. **League** (Giải đấu)
```prisma
model League {
  id         String  @id @default(cuid())
  sportId    String
  name       String        // "National Football League"
  shortName  String        // "NFL"
  slug       String  @unique
  color      String  @default("#64748b")
  icon       String?
  country    String?
  logoUrl    String?
  season     String?       // "2026"
  externalId String? @unique
  
  sport   Sport   @relation(fields: [sportId], references: [id])
  teams   Team[]
  matches Match[]
}
```
**Indexes:** sportId, slug, season  
**Purpose:** Organize sports into leagues

---

#### 4. **Team** (Đội bóng)
```prisma
model Team {
  id             String  @id @default(cuid())
  leagueId       String
  name           String        // "Kansas City Chiefs"
  shortName      String        // "KC"
  slug           String  @unique
  logoUrl        String?
  primaryColor   String  @default("#64748b")
  secondaryColor String  @default("#0f172a")
  externalId     String? @unique
  
  league      League  @relation(fields: [leagueId], references: [id])
  homeMatches Match[] @relation("HomeTeam")
  awayMatches Match[] @relation("AwayTeam")
  events      MatchEvent[]
}
```
**Indexes:** leagueId, slug  
**Purpose:** Team information, colors for UI, match relationships

---

#### 5. **Match** (Trận đấu)
```prisma
model Match {
  id         String      @id @default(cuid())
  slug       String      @unique
  leagueId   String
  title      String            // "KC Chiefs vs Buffalo Bills"
  homeTeamId String?           // Optional for MMA
  awayTeamId String?           // Optional for MMA
  startTime  DateTime
  status     MatchStatus       // SCHEDULED, LIVE, FINISHED, POSTPONED
  homeScore  Int         @default(0)
  awayScore  Int         @default(0)
  period     Int?              // Quarter, period, round
  clock      String?           // "8:42"
  venue      String?
  externalId String?     @unique
  updatedAt  DateTime    @updatedAt
  
  league      League       @relation(fields: [leagueId], references: [id])
  homeTeam    Team?        @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam    Team?        @relation("AwayTeam", fields: [awayTeamId], references: [id])
  events      MatchEvent[]
  streams     Stream[]
  highlights  Highlight[]
  predictions Prediction[]
}
```
**Indexes:** leagueId, status, startTime, slug  
**Purpose:** Match data, real-time updates, linked to streams

---

#### 6. **MatchEvent** (Diễn biến trận)
```prisma
model MatchEvent {
  id         String         @id @default(cuid())
  matchId    String
  teamId     String?
  type       MatchEventType         // SCORE, PENALTY, PERIOD_START, PERIOD_END, FINISH
  period     Int
  clock      String?        // "8:42"
  detail     String?        // "Mahomes TD pass to Kelce"
  createdAt  DateTime       @default(now())
  
  match Match @relation(fields: [matchId], references: [id], onDelete: Cascade)
  team  Team? @relation(fields: [teamId], references: [id])
  
  @@index([matchId, createdAt])
}
```
**Indexes:** matchId, createdAt, teamId  
**Purpose:** Live play-by-play, scoreboard updates via WebSocket

---

### C. Content & Streaming

#### 7. **Channel** (Kênh creator)
```prisma
model Channel {
  id         String   @id @default(cuid())
  ownerId    String   @unique
  handle     String   @unique   // @username
  title      String
  bio        String?
  avatarUrl  String?
  isVerified Boolean  @default(false)
  createdAt  DateTime @default(now())
  
  owner   User     @relation(fields: [ownerId], references: [id])
  streams Stream[]
}
```
**Indexes:** ownerId, handle  
**Purpose:** Creator profiles, linked to streams

---

#### 8. **Stream** (Livestream)
```prisma
model Stream {
  id            String        @id @default(cuid())
  channelId     String
  matchId       String?       // Optional: may not be linked to a match
  title         String
  status        StreamStatus  // IDLE, LIVE, ENDED
  contentSource ContentSource // UGC, OFFICIAL_EMBED, LICENSED
  streamKeyHash String?       @unique
  playbackId    String?       // Video provider ID
  embedUrl      String?       // For OFFICIAL_EMBED
  viewerPeak    Int           @default(0)
  startedAt     DateTime?
  endedAt       DateTime?
  createdAt     DateTime      @default(now())
  
  channel  Channel       @relation(fields: [channelId], references: [id])
  match    Match?        @relation(fields: [matchId], references: [id])
  vods     Vod[]
  dmca     DmcaRequest[]
  
  @@index([status])
}
```
**Indexes:** channelId, matchId, status, startedAt  
**Purpose:** Live stream management, linked to matches

---

#### 9. **Vod** (Video On Demand)
```prisma
model Vod {
  id           String   @id @default(cuid())
  streamId     String
  url          String   // Video URL hoặc storage ID
  durationSec  Int
  thumbnailUrl String?
  createdAt    DateTime @default(now())
  
  stream Stream @relation(fields: [streamId], references: [id], onDelete: Cascade)
}
```
**Purpose:** Archive livestreams for VOD replay

---

#### 10. **Highlight** (Tóm tắt trận)
```prisma
model Highlight {
  id           String   @id @default(cuid())
  matchId      String
  title        String   // "Mahomes Game-Winner TD"
  url          String   // Video URL
  thumbnailUrl String?
  source       String   // "user-generated", "official", etc.
  createdAt    DateTime @default(now())
  
  match Match @relation(fields: [matchId], references: [id], onDelete: Cascade)
}
```
**Purpose:** Curated match highlights

---

### D. Community & Engagement

#### 11. **Follow** (Theo dõi)
```prisma
model Follow {
  userId     String
  targetType FollowTarget   // TEAM, LEAGUE, CHANNEL
  targetId   String
  createdAt  DateTime       @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@id([userId, targetType, targetId])
  @@index([targetType, targetId])
}
```
**Purpose:** Personalized notifications, user preferences

---

#### 12. **Prediction** (Dự đoán)
```prisma
model Prediction {
  id        String   @id @default(cuid())
  userId    String
  matchId   String
  homePred  Int      // Predicted home score
  awayPred  Int      // Predicted away score
  points    Int?     // Points awarded if correct
  createdAt DateTime @default(now())
  
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  match Match @relation(fields: [matchId], references: [id], onDelete: Cascade)
  
  @@unique([userId, matchId])
}
```
**Purpose:** User match predictions, leaderboards

---

### E. Moderation & Legal

#### 13. **Report** (Báo cáo vi phạm)
```prisma
model Report {
  id         String       @id @default(cuid())
  reporterId String
  targetType String       // "message", "stream", "channel", etc.
  targetId   String       // ID của target
  reason     String       // "spam", "abuse", "copyright", etc.
  status     ReportStatus // OPEN, REVIEWING, RESOLVED, DISMISSED
  createdAt  DateTime     @default(now())
  
  reporter User @relation(fields: [reporterId], references: [id])
  
  @@index([status, createdAt])
}
```
**Purpose:** Community moderation, violation tracking

---

#### 14. **DmcaRequest** (DMCA Takedown)
```prisma
model DmcaRequest {
  id          String     @id @default(cuid())
  streamId    String
  claimant    String     // Copyright holder name
  evidenceUrl String     // Link to evidence
  status      DmcaStatus // RECEIVED, TAKEN_DOWN, REJECTED
  createdAt   DateTime   @default(now())
  handledAt   DateTime?
  
  stream Stream @relation(fields: [streamId], references: [id])
  
  @@index([status, createdAt])
}
```
**Purpose:** Copyright takedown requests

---

## IV. SEO Management Tables (New)

#### 15. **SeoMetaTag** (Meta Tags)
```prisma
model SeoMetaTag {
  id               String   @id @default(cuid())
  pageType         String   // "home", "category", "match", "team"
  pageId           String?  // ID of specific page (leagueId, matchId, etc.)
  pageUrl          String   @unique
  metaTitle        String   @db.VarChar(60)
  metaDescription  String   @db.VarChar(160)
  metaKeywords     String?  // Comma-separated
  ogTitle          String?
  ogDescription    String?
  ogImage          String?
  twitterTitle     String?
  twitterDescription String?
  twitterImage     String?
  canonicalUrl     String?
  robotsIndex      Boolean  @default(true)
  robotsFollow     Boolean  @default(true)
  updatedAt        DateTime @updatedAt
  updatedBy        String?  // Admin user ID
  
  @@index([pageType, pageId])
  @@index([pageUrl])
}
```
**Purpose:** SEO meta tags for all pages

---

#### 16. **SeoSchemaMarkup** (Schema JSON-LD)
```prisma
model SeoSchemaMarkup {
  id           String   @id @default(cuid())
  pageType     String   // "organization", "sportsEvent", "broadcastEvent", "videoObject"
  pageId       String?
  pageUrl      String   @unique
  schemaType   String   // "@type": "SportsEvent", etc.
  jsonLd       String   @db.Text  // Full JSON-LD markup
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([pageType, pageId])
}
```
**Purpose:** Structured data markup for search engines

---

#### 17. **SeoKeyword** (Keyword Tracking)
```prisma
model SeoKeyword {
  id               String   @id @default(cuid())
  pageId           String?
  pageUrl          String
  keyword          String
  searchVolume     Int?     // Monthly search volume
  difficulty       Float?   // Keyword difficulty %
  serpPosition     Int?     // Current SERP position
  keywordDensity   Float?   // % of page content
  isTargeting      Boolean  @default(true)
  trend            String   // "UP", "DOWN", "STABLE"
  lastCheckedAt    DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@index([pageUrl, keyword])
  @@unique([pageUrl, keyword])
}
```
**Purpose:** Keyword research and tracking

---

#### 18. **SeoRedirect** (Redirects)
```prisma
model SeoRedirect {
  id           String   @id @default(cuid())
  sourceUrl    String   @unique
  targetUrl    String
  redirectType String   // "301" (permanent), "302" (temporary)
  status       String   // "ACTIVE", "INACTIVE", "CHAINED"
  hitCount     Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([sourceUrl])
  @@index([status])
}
```
**Purpose:** URL redirects for broken links, migrations

---

#### 19. **SeoAuditLog** (Audit History)
```prisma
model SeoAuditLog {
  id           String   @id @default(cuid())
  pageUrl      String
  seoScore     Int      // 0-100
  passCount    Int      // # items passing
  warningCount Int      // # items with warnings
  failCount    Int      // # items failing
  issues       String   @db.Text  // JSON: [{name, status, message}]
  createdAt    DateTime @default(now())
  
  @@index([pageUrl, createdAt])
}
```
**Purpose:** Historical audit records

---

## V. Database Statistics & Indexes

### Table Sizes (Estimated)
| Table | Rows | Size |
|-------|------|------|
| User | 100K | 50MB |
| Match | 500 | 2MB |
| Stream | 50K | 20MB |
| SeoMetaTag | 100 | 1MB |
| SeoKeyword | 500 | 2MB |

### Critical Indexes
```sql
-- Performance critical
CREATE INDEX idx_match_status_starttime ON Match(status, startTime);
CREATE INDEX idx_stream_channel_status ON Stream(channelId, status);
CREATE INDEX idx_report_status_created ON Report(status, createdAt);
CREATE INDEX idx_seo_keyword_pageurl ON SeoKeyword(pageUrl, keyword);
```

---

## VI. Relationships Overview

### Key Foreign Keys
1. **User → Channel**: 1 creator can have 1 channel (1:1)
2. **Channel → Stream**: 1 creator can have many streams (1:N)
3. **Stream → Match**: 1 stream can link to 1 match, many streams per match (N:1)
4. **Match → Team**: 1 match has 2 teams (N:1 each)
5. **Match → MatchEvent**: 1 match has many events (1:N)
6. **User → Follow**: 1 user can follow multiple targets (1:N)
7. **User → ChatMessage**: 1 user can send many messages (1:N)

---

## VII. Enums Reference

### Role
- **VIEWER** - Regular user, watches streams
- **CREATOR** - Can create streams
- **MODERATOR** - Can moderate chat, reports
- **ADMIN** - Full access

### MatchStatus
- **SCHEDULED** - Match scheduled, not live yet
- **LIVE** - Match currently live
- **FINISHED** - Match concluded
- **POSTPONED** - Match delayed/rescheduled

### MatchEventType
- **SCORE** - Basket/goal/touchdown
- **PENALTY** - Foul/penalty/yellow/red card
- **PERIOD_START** - Quarter/period/round starts
- **PERIOD_END** - Quarter/period/round ends
- **FINISH** - Match finish (KO, submission, decision)
- **OTHER** - Miscellaneous event

### StreamStatus
- **IDLE** - Stream not started
- **LIVE** - Currently streaming
- **ENDED** - Stream finished

### ContentSource
- **UGC** - User-generated content
- **OFFICIAL_EMBED** - Embedded official stream
- **LICENSED** - Licensed content

### FollowTarget
- **TEAM** - Follow specific team
- **LEAGUE** - Follow league (all matches)
- **CHANNEL** - Follow creator channel

---

## VIII. Migration Strategy

### Phase 1: Core Tables (Already Created ✅)
- ✅ User, Sport, League, Team
- ✅ Match, MatchEvent
- ✅ Channel, Stream, Vod, Highlight
- ✅ ChatMessage, Follow, Prediction
- ✅ Report, DmcaRequest

### Phase 2: SEO Tables (Pending 📋)
- SeoMetaTag
- SeoSchemaMarkup
- SeoKeyword
- SeoRedirect
- SeoAuditLog

### Phase 3: Analytics Tables (Optional 📊)
```prisma
model ViewStats {
  id        String   @id @default(cuid())
  streamId  String?
  matchId   String?
  views     Int
  uniqueUsers Int
  avgWatchTime Int  // seconds
  date      DateTime
}

model UserAnalytics {
  id        String   @id @default(cuid())
  userId    String
  streamsWatched  Int
  totalWatchTime  Int
  followingCount  Int
  date      DateTime
}
```

---

## IX. Data Consistency & Constraints

### Cascade Deletes
- Delete Match → Delete MatchEvent, Stream, Highlight, Prediction
- Delete Stream → Delete Vod, ChatMessage, DmcaRequest
- Delete User → Delete Channel, Follows, Predictions, Reports

### Unique Constraints
- User.email, User.username
- League.slug, Team.slug, Match.slug
- Channel.ownerId, Channel.handle
- Stream.streamKeyHash
- Follow.userId + targetType + targetId (composite)
- Prediction.userId + matchId (composite)

---

## X. Performance Optimization

### Query Patterns
```sql
-- Get live matches with streams
SELECT m.*, s.* 
FROM Match m 
LEFT JOIN Stream s ON m.id = s.matchId 
WHERE m.status = 'LIVE' 
ORDER BY m.startTime DESC;

-- Get user's feed
SELECT s.*, m.title 
FROM Stream s 
LEFT JOIN Match m ON s.matchId = m.id 
JOIN Follow f ON (f.targetId = s.channelId AND f.targetType = 'CHANNEL')
WHERE f.userId = $1 
ORDER BY s.startedAt DESC;

-- SEO audit report
SELECT p.pageUrl, COUNT(*) as issues
FROM SeoAuditLog p
WHERE p.failCount > 0
GROUP BY p.pageUrl
ORDER BY p.createdAt DESC;
```

### Caching Strategy
- **Redis Cache:**
  - Live match data: 10 seconds
  - Match events: 5 seconds
  - League standings: 60 seconds
  - User preferences: 1 hour
  - SEO meta tags: 24 hours

---

## XI. Backup & Security

### Backup Strategy
- **Daily:** Full database dump
- **Hourly:** Transaction logs
- **Retention:** 30 days

### Data Sensitivity
- **Public:** Sport, League, Team, Match, Stream (status only), Channel
- **Private:** User email/avatar, Stream keys, DMCA requests
- **Admin:** User roles, Reports, Ban status

---

## XII. Future Considerations

### Potential Additions
1. **Analytics Tables** (view stats, user engagement)
2. **Notification Table** (user notifications history)
3. **SubscriptionTable** (premium features)
4. **BitcoinAddress** (if monetization added)
5. **AdminLog** (audit trail for admin actions)

### Scalability Notes
- Consider sharding on userId for massive scale (100M+ users)
- Archive old ChatMessages to separate table after 30 days
- Partitioning MatchEvent table by match date
- Read replicas for analytics queries

---

## XIII. Database Setup Commands

```bash
# Create PostgreSQL database
createdb arena_production

# Initialize Prisma
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed sample data
npm run db:seed

# View database schema
npx prisma studio
```

---

## XIV. Summary

**Total Tables:** 19 models  
**Total Relationships:** 24+ foreign keys  
**Estimated Size:** 5-50GB (depending on usage)  
**Connection Pool:** 20 connections minimum  
**Recommended Server:** PostgreSQL 16+, 16GB RAM, SSD storage

This design supports:
- ✅ Multi-sport streaming platform
- ✅ Real-time match updates
- ✅ Community features (follows, predictions)
- ✅ Creator monetization
- ✅ SEO optimization
- ✅ Content moderation
- ✅ Analytics & reporting

---

**Document Version:** 1.0  
**Last Updated:** 2026-10-11  
**Status:** Ready for Phase 2 SEO Implementation
