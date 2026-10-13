# 🛡 CyberShield — Smart Threat Detection

Check whether a **link, file, SMS/email message, QR code, IP address or password** is
dangerous. CyberShield queries real security APIs (Google Safe Browsing, VirusTotal,
AbuseIPDB, RDAP, Have I Been Pwned) and Gemini AI, then returns a **0–100 threat score**,
a verdict (**Safe / Suspicious / Dangerous**) and a plain-language explanation.
No account needed. The latest report is kept in this browser tab's session storage so it survives a refresh.

> Final-year B.Sc. Computer Science project. Stack: React + Vite + Tailwind + Framer Motion
> on the front end, Node + Express on the back end, Firestore for the public scan counter.
> Deploys to GitHub Pages (client) and Render (API).

---

## Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Folder structure](#folder-structure)
4. [Run locally](#run-locally)
5. [Getting the API keys](#getting-the-api-keys)
6. [Firebase setup](#firebase-setup)
7. [Threat score engine](#threat-score-engine)
8. [API reference](#api-reference)
9. [Privacy & security design](#privacy--security-design)
10. [Deploy to GitHub Pages + Render](#deploy-to-github-pages--render)
11. [Viva cheat-sheet](#viva-cheat-sheet)

---

## Features

| Module | What it does | Sources |
|--------|--------------|---------|
| **Link Scanner** | Phishing / malware URL check with domain age and structural heuristics | Google Safe Browsing v4, VirusTotal v3 (70+ engines), RDAP, Gemini |
| **File Scanner** | SHA-256 "hash-first" lookup; uploads only unknown files (≤ 32 MB), never stores them | VirusTotal v3 |
| **SMS / Email Checker** | Detects KYC, OTP, job, bill, courier, loan scams; highlights red-flag phrases; scans links inside | Gemini (strict JSON) + rule engine + Link Scanner |
| **QR Scanner** | Camera or image decode; URL → Link Scanner; UPI → "you never scan to receive money" warning | jsQR (browser) |
| **IP Checker** | Abuse confidence, reports, country, ISP, usage type, proxy / hosting | AbuseIPDB, ip-api |
| **Password Leak Checker** | k-anonymity breach lookup + local strength meter; password never leaves the browser | Have I Been Pwned range API |
| **Result page** | Animated speedometer gauge, verdict badge, AI explanation, "why this score" breakdown, per-source cards, engine grid, red alert on Dangerous, PDF download | jsPDF |
| **Awareness** | 7 Indian scam explainers with examples + helplines + 10-question quiz | — |

UI: "Cyber Command Center" dark glassmorphism theme, radar scan animation with live status
lines, 3D-tilt scanner cards, mobile responsive, respects `prefers-reduced-motion`.

---

## Architecture

```
┌──────────────────────────────── Browser (React + Vite) ─────────────────────────────────┐
│                                                                                           │
│  Home ─ Scanner(6 tabs) ─ Result(gauge) ─ Awareness(quiz)                                 │
│                                                                                           │
│  Runs locally in the browser:                                                             │
│   • SHA-256 of files (Web Crypto)          • jsQR decode + UPI parse                      │
│   • SHA-1 + k-anonymity password check  ───────────────────────────► api.pwnedpasswords  │
│   • Threat gauge / PDF (jsPDF)                                                            │
│                                                                                           │
│   Firebase SDK ──────────────────────────────────────────────────► Cloud Firestore        │
│                                                                      stats/global counter │
└───────────────┬───────────────────────────────────────────────────────────────────────────┘
                │  HTTPS  /api/scan/{url|file|message|ip}   (CORS = CLIENT_ORIGIN only)
                ▼
┌────────────────────────────── Express API (server/) ────────────────────────────────────┐
│  rate-limit (20 / 10 min / IP) → routes/scan.js → services/*  → utils/threatScore.js     │
│  in-memory 1-hour cache (protects VirusTotal's 4 req/min free tier)                       │
│                                                                                           │
│   urlScanner ──► Google Safe Browsing ─┐                                                  │
│               ──► VirusTotal (URL)    ─┤  Promise.all → score → Gemini explanation        │
│               ──► RDAP domain age     ─┤                                                  │
│               ──► heuristics (local)  ─┘                                                  │
│   fileScanner ──► VirusTotal hash lookup → (unknown? upload + poll)                       │
│   messageScanner ► Gemini strict-JSON + rule engine + urlScanner for embedded links       │
│   ipScanner ───► AbuseIPDB + ip-api geo                                                   │
│                                                                                           │
│   API keys live ONLY here (server/.env). The browser never sees them.                     │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

Request flow for a link scan:

```
user pastes URL → UrlScanForm validates → POST /api/scan/url
  → normalizeUrl + heuristics            (0 ms, local)
  → Safe Browsing | VirusTotal | RDAP    (parallel, each returns {available:false} on failure)
  → scoreUrl() → {score, verdict, breakdown}
  → Gemini explains (fallback template if no key)
  → cache 1 h → JSON report
→ radar overlay (min 2.4 s) → navigate to /result → gauge animates → public counter +1
```

---

## Folder structure

```
CollageProject/
├── package.json            `npm run dev` starts API + client together (concurrently)
├── README.md
├── firestore.rules         Firestore security rules (public +1 counter only)
├── firebase.json           Firebase CLI config
├── render.yaml             Render blueprint for the API
├── .claude/launch.json     Dev-server launch config (Claude desktop)
│
├── client/                 React 19 + Vite 8 + Tailwind v4 + Framer Motion
│   ├── .env.example        VITE_FIREBASE_* (public) + VITE_API_BASE_URL
│   └── src/
│       ├── App.jsx                 Lazy-loaded routes
│       ├── index.css               Theme tokens (@theme), glass utilities, reduced-motion
│       ├── config/
│       │   ├── scanners.js         Single source of truth for the 6 modules + verdict map
│       │   ├── scams.js            Awareness content (7 scams + helplines)
│       │   └── quiz.js             10 quiz questions
│       ├── services/
│       │   ├── api.js              fetch wrapper for the Express API
│       │   └── scans.js            Firestore: public scan counter
│       ├── lib/
│       │   ├── firebase.js         Guarded Firebase bootstrap (works without keys)
│       │   ├── hash.js             Web Crypto SHA-256 / SHA-1
│       │   ├── qr.js / qrReport.js jsQR decode, content parser, QR → report
│       │   ├── password.js         k-anonymity HIBP lookup + strength estimator
│       │   ├── localScore.js       Client-side weights (UPI QR, password)
│       │   ├── pdfReport.js        jsPDF + autotable report
│       │   └── resultStore.js      sessionStorage for the last result
│       ├── hooks/                  useTotalScans (live Firestore counter), useCountUp
│       ├── components/
│       │   ├── background/         ParticleNetwork canvas
│       │   ├── layout/             Navbar, Footer, Layout (transitions, error boundary)
│       │   ├── ui/                 Icon, Button, GlassCard, TiltCard, PageHeader, ErrorBoundary…
│       │   ├── home/               Hero, AnimatedShield, LiveStats, ScannerCards, HowItWorks
│       │   ├── scanner/            RadarScan + one form per module + QrCamera
│       │   ├── result/             ThreatGauge, VerdictBadge, DangerAlert, EngineGrid, *Findings
│       │   └── awareness/          ScamCard, Quiz
│       └── pages/                  Home, Scanner, Result, Awareness, NotFound
│
└── server/                 Node 20+ / Express 5 (ES modules)
    ├── index.js            CORS, JSON limit, rate limit, routes, error handler, /api/health
    ├── .env.example        All secret keys
    ├── routes/scan.js      /url  /file  /message  /ip
    ├── services/
    │   ├── urlScanner.js       Module 1 orchestrator
    │   ├── fileScanner.js      Module 2 (hash-first)
    │   ├── messageScanner.js   Module 3
    │   ├── ipScanner.js        Module 6
    │   ├── safeBrowsing.js / virusTotal.js / rdap.js / gemini.js / abuseIpdb.js / ipGeo.js
    ├── utils/
    │   ├── threatScore.js      WEIGHTS + THRESHOLDS + scoreUrl/File/Ip/Message
    │   ├── urlUtils.js         normalizeUrl, heuristics, keyword list, extractUrls
    │   ├── messageHeuristics.js 16 Indian scam patterns (fallback when Gemini is off)
    │   ├── cache.js            In-memory TTL cache
    │   └── config.js           Which keys are present
    └── middleware/         rateLimiter, upload (multer memory, 32 MB), errorHandler
```

---

## Run locally

Requirements: Node 22.12+ (tested on Node 24), npm. Vite requires Node 20.19+ or 22.12+, and the API's Gemini SDK requires Node 20+.

```bash
git clone <repo> && cd CollageProject
npm run install:all
cp server/.env.example server/.env      # add API keys (optional at first)
cp client/.env.example client/.env      # add Firebase keys (optional at first)
npm run dev                             # starts API on :5001 and client on :5173
```

Open <http://localhost:5173>. The client proxies `/api/*` to the API on port **5001**
(port 5000 is used by AirPlay Receiver on macOS).

**Without any keys** the app still runs: link heuristics, RDAP domain age, rule-based message
analysis, IP geolocation, QR decoding and the password checker all work, and the Result page
marks missing sources as "Not configured" with a *Partial result* banner. The live
"Total scans" tile on the Home page needs Firebase (see below); otherwise it shows a demo number.

Health check: `curl http://localhost:5001/api/health` lists which keys are loaded.

---

## Getting the API keys

| Key (server/.env) | Where to get it | Free tier |
|-------------------|-----------------|-----------|
| `VIRUSTOTAL_API_KEY` | <https://www.virustotal.com> → sign up → profile → *API key* | 4 req/min, 500/day (we cache 1 h) |
| `SAFE_BROWSING_API_KEY` | Google Cloud Console → *APIs & Services* → enable **Safe Browsing API** → *Credentials* → API key | 10 000 req/day |
| `GEMINI_API_KEY` | <https://aistudio.google.com/app/apikey> — several keys may be comma-separated (one per Google Cloud project) and are rotated on quota errors | per-project daily limit; app falls back to rule-based text when exhausted |
| `GEMINI_MODEL` | any Gemini model id, default `gemini-3.5-flash` | — |
| `GEMINI_EXPLAIN_MODEL` | model for short result explanations, default `gemini-3.5-flash-lite` | — |
| `ABUSEIPDB_API_KEY` | <https://www.abuseipdb.com/account/api> | 1 000 checks/day |
| `CLIENT_ORIGIN` | your client URL(s), comma-separated | — |

RDAP (domain age), ip-api (geolocation) and Have I Been Pwned (passwords) need no key.

---

## Firebase setup (optional — live scan counter)

Firestore is used for one thing: the public "Total scans" number on the Home page.
There are no accounts and no personal data.

1. Firebase console → create a project → **Firestore Database → Create database**
   (production mode).
2. Project settings → *Your apps* → Web app → copy the config into `client/.env` as
   `VITE_FIREBASE_*` (see `client/.env.example`).
3. Publish the rules: paste `firestore.rules` into Firestore → Rules → Publish, or

```bash
npm install -g firebase-tools && firebase login && firebase use <project-id> && firebase deploy --only firestore:rules
```

| Collection | Document | Fields |
|------------|----------|--------|
| `stats` | `global` | totalScans — anyone may read it and increment it by exactly 1 |

---

## Threat score engine

All weights live in `server/utils/threatScore.js` (`WEIGHTS`, `THRESHOLDS`) and
`client/src/lib/localScore.js` for the two browser-only modules.

**Link** (capped at 100):

| Signal | Points |
|--------|--------|
| Google Safe Browsing match | +50 |
| Each VirusTotal engine flagging malicious/suspicious | +10 (max +40) |
| Domain registered < 30 days ago (RDAP) | +15 |
| HTTP instead of HTTPS | +5 |
| Suspicious keywords (kyc, verify, login, otp, bank names…) | +10 |
| Raw IP address as host | +10 |
| 3+ subdomains | +5 |
| "@" trick or punycode domain | +10 |

**File**: 8 points per detecting engine (cap 100). **IP**: AbuseIPDB confidence score, +10 if
more than 20 reports. **Message**: Gemini `riskScore` (or rule-based score) + half of the worst
embedded-link score. **UPI QR**: +30 for being a payment request, +15 pre-filled amount,
+10 unusual handle, +15 scam words, +10 personal name with fixed amount.
**Password**: +70 if breached (+10 per order of magnitude, max +30); otherwise +45/+35/+20 for
very weak / weak / fair.

Verdict: **0–30 Safe · 31–60 Suspicious · 61–100 Dangerous**. Every report returns a
`breakdown[]` so the Result page can show exactly why.

---

## API reference

Base URL: `http://localhost:5001` (dev) or your Render URL. All scan routes are rate-limited
to 20 requests per 10 minutes per IP and return `429 { error: "rate_limited" }` beyond that.

| Method | Path | Body / query | Notes |
|--------|------|--------------|-------|
| GET | `/api/health` | — | `{ ok, apis: { virusTotal, safeBrowsing, gemini, abuseIpdb } }` |
| POST | `/api/scan/url` | `{ "url": "…" }` | `?fresh=1` bypasses the 1-hour cache |
| POST | `/api/scan/file` | JSON `{ sha256, fileName, size, mimeType }` | hash-first; returns `{ needsUpload: true }` if unknown |
| POST | `/api/scan/file` | multipart `file` + `sha256` | ≤ 32 MB, memory only, then poll analysis |
| POST | `/api/scan/message` | `{ "text": "…" }` (≤ 5000 chars) | links inside are scanned too (max 3) |
| GET | `/api/scan/ip?ip=` | — | IPv4 / IPv6 |

Every report has the same shape:

```json
{
  "scanType": "url", "input": "…", "inputPreview": "…",
  "threatScore": 65, "verdict": "dangerous",
  "summary": "…", "explanation": "…", "aiAvailable": true,
  "breakdown": [{ "label": "…", "points": 50 }],
  "sources": { "safeBrowsing": { "available": true, … }, "virusTotal": { … }, … },
  "unavailableSources": [], "scannedAt": "ISO", "cached": false
}
```

---

## Privacy & security design

- **API keys never reach the browser.** Every third-party call except Have I Been Pwned goes
  through the Express API; CORS is restricted to `CLIENT_ORIGIN`.
- **Files**: SHA-256 is computed in the browser (Web Crypto). The API first asks VirusTotal
  about the hash; bytes are uploaded only if the file is unknown, held in a multer memory
  buffer and dropped after the request. The API does not write file bytes to disk; unknown files are sent to VirusTotal for analysis.
- **Passwords**: never leave the browser. SHA-1 locally, only the first 5 hex characters go to
  `api.pwnedpasswords.com/range/{prefix}` with `Add-Padding: true`; the suffix comparison
  happens locally. The form clears on submit and the saved report holds a masked preview only.
- **Messages**: the full text goes to Gemini for analysis when configured. The API does not persist it; the latest report, including the message, remains in the browser tab's session storage until the tab session ends.
- **QR codes**: decoded entirely in the browser; only a decoded URL is sent to the API.
- **Input validation**: URL normalisation, IP validation with `net.isIP`, message length cap,
  32 MB upload cap, JSON body limit 64 kB, SHA-256 format check.
- **Graceful degradation**: `Promise.all` over sources that never throw — a failing API is
  marked `available: false` and the UI shows a *Partial result* banner. Link and password
  scans may still show a verdict based on the remaining signals; missing checks do not prove safety.
- **Rate limiting + cache** protect the VirusTotal free tier (4 req/min).
- Firestore rules: the only writable document is the public counter, and only by +1.

---

## Deploy to GitHub Pages + Render

**API on Render**

1. Push the repo to GitHub. In Render choose *New → Blueprint* and select the repo
   (`render.yaml` sets root dir `server`, build `npm install`, start `npm start`, health
   check `/api/health`).
2. Fill the secret env vars in the Render dashboard and set `CLIENT_ORIGIN=https://laxmiyadav72335.github.io` (the origin has no `/cybershield/` path).
3. Note the service URL, e.g. `https://cybershield-api.onrender.com`.

**Client on GitHub Pages**

1. In the `laxmiyadav72335/cybershield` repository, choose **Settings → Pages → Build and deployment → GitHub Actions**.
2. In **Settings → Secrets and variables → Actions → Variables**, set `VITE_API_BASE_URL` to the HTTPS Render service URL. Set the six `VITE_FIREBASE_*` values there too if you want the live scan counter.
3. Push `main`. `.github/workflows/pages.yml` tests and builds the client, then publishes it at `https://laxmiyadav72335.github.io/cybershield/`. Pages uses hash routes such as `/#/scan/url` so scanner links survive reloads.

Free Render instances sleep after inactivity; the first request may take ~30 s.

---

## Viva cheat-sheet

- **Why hash-first for files?** Saves bandwidth and quota: most files are already known to
  VirusTotal, and a 64-character hash reveals nothing about the content.
- **What is k-anonymity?** Sending only a 5-character hash prefix means the server sees a set
  of ~1 million candidates and cannot know which password was checked.
- **Why go through our backend?** To keep API keys secret, apply rate limiting, cache, and
  combine sources into one score.
- **How is the score computed?** Weighted sum of independent signals, capped at 100, mapped
  to three verdict bands — all weights in one object (`threatScore.js`).
- **What if Gemini is down?** A template explanation is generated from the breakdown; the
  message module falls back to 16 regex scam patterns.
- **Why `Promise.all` with never-throwing services?** So one slow or failing API does not
  block the others — "graceful degradation".
- **UPI QR insight:** a UPI QR is a *collect/pay* request; scanning + PIN only ever sends money.
