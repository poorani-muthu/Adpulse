# AdPulse — Google Ads Analytics Platform

A full-stack ad campaign analytics platform built to demonstrate software engineering skills aligned with the **Google Ads Software Engineer II** role.

[![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?style=flat)](https://vitejs.dev)
[![Backend](https://img.shields.io/badge/Backend-Java%20Spring%20Boot%203-6db33f?style=flat)](https://spring.io)
[![C++](https://img.shields.io/badge/Engines-C%2B%2B17%20%2F%20WASM-00599c?style=flat)](https://emscripten.org)

---

## Architecture

```
adpulse/
├── frontend/          React + Vite (8 pages, JWT auth, recharts)
│   └── src/
│       ├── pages/     Dashboard, Campaigns, Analytics, Optimizer,
│       │              ABTest, Fraud, Keywords, Settings
│       ├── components/ Layout, Sidebar
│       ├── api/       apiService.js (REST client)
│       └── context/   AuthContext (JWT + localStorage)
├── backend/           Java Spring Boot 3
│   └── src/main/java/com/adpulse/
│       ├── controller/ AuthController, CampaignController
│       ├── service/    AuthService, CampaignService, DataSeeder
│       ├── model/      Campaign, AppUser (JPA entities)
│       ├── repository/ CampaignRepository, UserRepository
│       ├── security/   JwtUtil, JwtFilter, SecurityConfig
│       └── dto/        AuthDTOs, CampaignDTOs
└── cpp/               C++17 computation engines
    ├── src/            ABTestEngine, KeywordMatchEngine, ClickFraudDetector
    ├── include/        Headers for all engines
    ├── tests/          Google Test suite (15 test cases)
    ├── CMakeLists.txt
    └── build_wasm.sh   Compile to WebAssembly via Emscripten
```

---

## C++ Engines

Three production-grade C++ modules implement compute-heavy logic — the same separation of concerns Google uses internally:

### ABTestEngine.cpp
Statistical significance calculator for A/B testing ad campaigns.
- **Welch's t-test** for unequal variance groups
- **Lanczos gamma approximation** (g=7, n=9 coefficients)
- **Lentz's continued fraction** for the regularized incomplete beta function (p-value)
- 95% confidence interval for conversion rate lift

### KeywordMatchEngine.cpp
Google Ads-style keyword matching engine.
- **Exact match**: token-for-token equality after normalization
- **Phrase match**: keyword token sequence found within query
- **Broad match**: stemmed keyword tokens as subset of stemmed query
- **Porter Stemmer** (subset of rules) for morphological reduction
- Stop-word filtering (20 common English stop words)
- **Jaccard similarity** for relevance scoring

### ClickFraudDetector.cpp
Multi-signal click fraud detection using statistical anomaly scoring.
- **Velocity Z-score**: clicks-per-minute bucket analysis
- **IP repetition score**: fraction of clicks from top IP
- **Geographic standard deviation**: tight geo = suspicious
- **Bot CV detection**: low coefficient of variation = regular = bot
- Composite weighted score → `FRAUD` if score > 0.65

---

## Quick Start

```bash
# Clone and setup everything
git clone https://github.com/YOUR_USERNAME/adpulse.git
cd adpulse
bash setup.sh
```

### Manual Setup

**Frontend**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest test suite
```

**Backend**
```bash
cd backend
mvn spring-boot:run          # http://localhost:8080
mvn test                     # JUnit integration tests
```

**C++ Engines**
```bash
cd cpp
cmake -B build && cmake --build build
./build/run_tests            # Google Test suite (15 tests)
bash build_wasm.sh           # Compile to WASM (requires Emscripten)
```

---

## Demo Credentials

| Role   | Username | Password   | Access |
|--------|----------|------------|--------|
| Admin  | admin    | admin123   | Full CRUD + all pages |
| Viewer | viewer   | viewer123  | Read-only dashboard |

---

## API Reference

| Method | Endpoint                  | Auth     | Description |
|--------|---------------------------|----------|-------------|
| POST   | /api/auth/login           | Public   | JWT login |
| POST   | /api/auth/register        | Public   | Register user |
| GET    | /api/campaigns            | Any      | List campaigns (filter: adType, search) |
| GET    | /api/campaigns/{id}       | Any      | Get campaign |
| POST   | /api/campaigns            | ADMIN    | Create campaign |
| PUT    | /api/campaigns/{id}       | ADMIN    | Update campaign |
| DELETE | /api/campaigns/{id}       | ADMIN    | Delete campaign |
| GET    | /api/campaigns/dashboard  | Any      | KPI summary stats |
| GET    | /api/campaigns/optimized  | Any      | Budget optimizer (ROAS-ranked) |

---

## Testing

**Frontend (Vitest)** — 9 tests
```
✓ ABTestEngine — significant difference detected
✓ ABTestEngine — no winner for small delta
✓ ABTestEngine — positive lift computed
✓ ABTestEngine — A wins when A converts better
✓ KeywordMatchEngine — exact match passes
✓ KeywordMatchEngine — exact fails with extra token
✓ KeywordMatchEngine — phrase match in longer query
✓ KeywordMatchEngine — broad match with stemming
✓ KeywordMatchEngine — broad fails no overlap
```

**Backend (JUnit 5)** — 8 tests
```
✓ Admin login succeeds, token returned
✓ Viewer login succeeds
✓ Invalid credentials return 401
✓ GET /campaigns requires auth
✓ GET /campaigns returns array with token
✓ POST /campaigns succeeds as ADMIN
✓ POST /campaigns forbidden as VIEWER
✓ GET /campaigns/dashboard returns stats
```

**C++ (Google Test)** — 15 tests
```
ABTestEngine (5): significant difference, no winner, lift, CI bounds, zero-size throws
KeywordMatchEngine (5): exact, exact-fail, phrase, broad-stem, relevance range
ClickFraudDetector (5): legit traffic, bot detected, score range, empty events, reason string
```

---

## Deployment (Free Tier)

### Frontend → Vercel (recommended, ~2 min)
1. Push to GitHub
2. [vercel.com](https://vercel.com) → New Project → Import repo
3. Root: `frontend/` | Build: `npm run build` | Output: `dist`
4. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`

### Backend → Render
1. [render.com](https://render.com) → New Web Service → Connect repo
2. Root: `backend/` | Build: `mvn package -DskipTests` | Start: `java -jar target/*.jar`
3. Free tier — may sleep after 15 min inactivity

### Full Stack → Railway
1. [railway.app](https://railway.app) → New Project → GitHub repo
2. Add two services: `frontend/` and `backend/`
3. Set `VITE_API_URL` in frontend to backend Railway URL

---

## Resume Bullet

> **AdPulse** — Google Ads Analytics Platform *(React, Java Spring Boot, C++/WebAssembly)*
> Built a full-stack ad campaign analytics platform with JWT auth, role-based access, and CRUD. Implemented three C++ computation engines (statistical A/B testing via Welch's t-test with Lanczos gamma approximation, keyword match engine with Porter Stemmer and Jaccard relevance scoring, click fraud detector using Z-score velocity analysis and bot CV detection) compiled to WebAssembly via Emscripten. Deployed on Vercel + Render with 32 automated tests across Vitest, JUnit 5, and Google Test.

---

## Skills Demonstrated (mapped to JD)

| JD Requirement | Evidence in Project |
|---|---|
| Python/C/C++/Java/JavaScript | C++ engines, Java Spring Boot, React/JS frontend |
| Write product/system code | Full CRUD, JWT auth, REST API, 3 C++ engines |
| Code review practices | Clean architecture, DTOs, separation of concerns |
| Documentation | This README, inline comments, API table |
| Triage/debug issues | Error handling in all layers, test suite catches regressions |
| Accessible technologies | Semantic HTML, ARIA-compatible, keyboard-navigable |
| Large-scale system design | Designed for WASM integration, stateless JWT, H2→Postgres swap-ready |
