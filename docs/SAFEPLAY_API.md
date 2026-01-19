# SafePlay Website API Integration

This document explains how the Chrome extension should integrate with the SafePlay website API for credit tracking and video filtering.

## Base URL

```
https://safeplay.app  (production)
http://localhost:3000 (development)
```

## Authentication

All API endpoints support two authentication methods:

1. **Session cookies** (website) - automatic via browser
2. **Bearer token** (extension) - pass Supabase JWT in Authorization header

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${supabaseAccessToken}`,
};
```

### Getting the Auth Token

After user logs in via the website, the extension should store the Supabase access token:

```typescript
// In background script or via deep link from website
chrome.storage.local.set({
  safeplay_auth_token: supabaseSession.access_token
});
```

---

## API Endpoints

### 1. Get Video Preview

Get video metadata including duration and credit cost **before** filtering.

```
POST /api/filter/preview
```

**Request:**
```json
{
  "youtube_id": "dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "youtube_id": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "channel_name": "Rick Astley",
  "duration_seconds": 213,
  "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "credit_cost": 4,
  "cached": false,
  "has_transcript": false,
  "user_credits": 45,
  "has_sufficient_credits": true
}
```

**Fields:**
- `credit_cost`: Number of credits required (1 per minute, min 1). 0 if cached.
- `cached` / `has_transcript`: If true, video is free to filter (already processed)
- `user_credits`: User's current available credits
- `has_sufficient_credits`: Whether user can afford to filter this video

---

### 2. Get Credit Balance

Fetch user's current credit balance.

```
GET /api/credits/balance
```

**Response:**
```json
{
  "balance": {
    "available": 45,
    "usedThisPeriod": 105,
    "rollover": 0,
    "topup": 20,
    "periodStart": "2025-01-01T00:00:00Z",
    "periodEnd": "2025-02-01T00:00:00Z",
    "planCredits": 750,
    "percentUsed": 14
  }
}
```

---

### 3. Start Filtering

Start the video filtering process. Credits are deducted when processing completes.

```
POST /api/filter/start
```

**Request:**
```json
{
  "youtube_id": "dQw4w9WgXcQ",
  "filter_type": "mute",
  "custom_words": ["darn", "heck"]
}
```

**Response (cached video - immediate):**
```json
{
  "status": "completed",
  "cached": true,
  "transcript": { ... },
  "video": {
    "youtube_id": "dQw4w9WgXcQ",
    "title": "...",
    "duration_seconds": 213
  },
  "credits_used": 0,
  "history_id": "uuid"
}
```

**Response (processing started):**
```json
{
  "status": "processing",
  "job_id": "abc123",
  "youtube_id": "dQw4w9WgXcQ",
  "message": "Video processing started"
}
```

**Error (insufficient credits):**
```json
{
  "error": "Insufficient credits",
  "error_code": "INSUFFICIENT_CREDITS",
  "required": 10,
  "available": 5
}
```

---

### 4. Check Job Status

Poll for processing status. Call every 2 seconds.

```
GET /api/filter/status/{jobId}
```

**Response (processing):**
```json
{
  "status": "transcribing",
  "progress": 65,
  "message": "Analyzing audio...",
  "video": {
    "youtube_id": "dQw4w9WgXcQ",
    "title": "..."
  }
}
```

**Response (completed):**
```json
{
  "status": "completed",
  "progress": 100,
  "message": "Complete!",
  "transcript": { ... },
  "video": {
    "youtube_id": "dQw4w9WgXcQ",
    "title": "...",
    "duration_seconds": 213
  },
  "credits_used": 4,
  "history_id": "uuid"
}
```

**Status Progression:**
- `pending` (5%) - "Preparing video..."
- `downloading` (5-35%) - "Downloading video..."
- `transcribing` (35-95%) - "Analyzing audio..."
- `completed` (100%) - "Complete!"

---

## Integration Guide

### Step 1: Update API Client

Change the extension's API client to use the SafePlay website instead of the orchestrator directly.

```typescript
// src/api/client.ts

const API_BASE_URL = 'https://safeplay.app'; // or from env

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // ... handle response
}
```

### Step 2: Add Preview Step

Before filtering, fetch preview to show credit cost:

```typescript
// Before user clicks "Filter"
export async function getVideoPreview(youtubeId: string): Promise<VideoPreview> {
  return request<VideoPreview>('/api/filter/preview', {
    method: 'POST',
    body: { youtube_id: youtubeId },
  });
}

// Show to user:
// "This video is 4 minutes long and will cost 4 credits."
// "You have 45 credits remaining."
```

### Step 3: Display Credit Info in UI

Update the button/popup to show:
- Current credit balance
- Cost to filter current video
- Warning if insufficient credits

```typescript
// In content script or popup
const preview = await getVideoPreview(videoId);

if (!preview.has_sufficient_credits) {
  showWarning(`Insufficient credits. Need ${preview.credit_cost}, have ${preview.user_credits}`);
  return;
}

// Show confirmation
showConfirmation(`Filter this video for ${preview.credit_cost} credits?`);
```

### Step 4: Use Website API for Filtering

Replace direct orchestrator calls:

```typescript
// OLD (direct to orchestrator)
const response = await fetch('https://orchestrator.../api/filter', ...);

// NEW (through website - tracks credits)
const response = await fetch('https://safeplay.app/api/filter/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ youtube_id: videoId }),
});
```

### Step 5: Handle Authentication

Add a way for users to log in. Options:

1. **Deep link to website login** - Open safeplay.app/login, website sends token back
2. **OAuth popup** - Implement Supabase auth in extension popup
3. **Token paste** - User copies token from website settings

---

## Credit System

| Cost | Description |
|------|-------------|
| 1 credit/minute | Base rate for video filtering |
| Minimum 1 credit | Even for short videos |
| 0 credits | Re-watching cached videos |

### Monthly Allowances by Plan

| Plan | Credits/Month | Cost |
|------|--------------|------|
| Free | 30 | $0 |
| Base | 750 | $9.99 |
| Professional | 2,500 | $19.99 |
| Unlimited | Unlimited | $39.99 |

### Top-up Packs

| Pack | Credits | Price |
|------|---------|-------|
| Small | 250 | $4.99 |
| Medium | 500 | $9.99 |
| Large | 1,000 | $19.99 |
| Mega | 2,500 | $49.99 |

---

## Error Codes

| Code | Description |
|------|-------------|
| `INSUFFICIENT_CREDITS` | User doesn't have enough credits |
| `AGE_RESTRICTED` | Video is age-restricted, cannot filter |
| `VIDEO_UNAVAILABLE` | Video not found or private |
| `UNAUTHORIZED` | Invalid or expired auth token |

---

## Example: Complete Filter Flow

```typescript
async function filterVideo(youtubeId: string): Promise<Transcript> {
  // 1. Get preview with credit info
  const preview = await request('/api/filter/preview', {
    method: 'POST',
    body: { youtube_id: youtubeId },
  });

  // 2. Check if user can afford it
  if (!preview.has_sufficient_credits && !preview.has_transcript) {
    throw new Error(`Need ${preview.credit_cost} credits, have ${preview.user_credits}`);
  }

  // 3. Start filtering
  const startResponse = await request('/api/filter/start', {
    method: 'POST',
    body: { youtube_id: youtubeId, filter_type: 'mute' },
  });

  // 4. If already cached, return immediately
  if (startResponse.status === 'completed') {
    return startResponse.transcript;
  }

  // 5. Poll for completion
  const jobId = startResponse.job_id;
  while (true) {
    const status = await request(`/api/filter/status/${jobId}`);

    updateProgress(status.progress, status.message);

    if (status.status === 'completed') {
      // Credits were deducted, history was saved
      return status.transcript;
    }

    if (status.status === 'failed') {
      throw new Error(status.error);
    }

    await sleep(2000);
  }
}
```
