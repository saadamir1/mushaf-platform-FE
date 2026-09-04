# Mushaf Platform - Frontend

![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)

Modern frontend for **Mushaf Platform** — Digital Quran Aziz (scanned pages + Urdu topics). Elder-friendly UI (teal/navy), React 18.

> Session notes: [`../CHANGELOG-2026-09-04.md`](../CHANGELOG-2026-09-04.md) · handover: [`../HANDOVER.md`](../HANDOVER.md)

## What’s new (2026-09-04)

- Surah list shows **mapped start pages** (Fatihah → 37 … Nas → 1021)
- Premium **PageViewer** (map strip, hotspots, night/focus, share, swipe)
- **Home**: continue reading, today’s focus, 30-day khatm, Surah / Juz / Reader tabs
- **Guide** (`/insights`) + Topic Search polish
- **Admin**: upload Mushaf page → **auto Surah/Para remap**
- Wider layout (max **1600px**) — less empty side space
- Auth aligned with API (JWT refresh, profile update, password rules)

## Quick Start

```bash
git clone https://github.com/saadamir1/mushaf-platform-FE.git
cd mushaf-platform-FE
npm install
npm start
```

App: **http://localhost:3001** (API: `http://localhost:3000/api/v1`)

## Git (personal account only)

Repo: **github.com/saadamir1/mushaf-platform-FE**  
Local author should be `Saad Amir` / `saadamir070@gmail.com` — **not** office `saad.amir@innovotechnologies.com` / `saadamir-ds`.

## Foundation (reusable)

Registration, login, JWT + refresh, email verification, password reset, profile, RBAC, admin panel, dark/light theme.

## Features

- Page-based Quran viewer (Cloudinary)
- Topic search → jump to page
- Bookmarks + reading progress
- Static JSON fallback (`src/data/`) if API is down

## Structure

```
src/
├── components/   # Navbar, Layout, QuranReader, ui/*
├── context/      # Auth, Theme
├── pages/        # Home, PageViewer, Insights, Admin, auth
├── services/api.js
├── data/         # surahs.json, pages.json, juz.json
├── utils/        # pageMap, pageIndex
└── styles/modern.css
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server :3001 |
| `npm run build` | Production build |

## Related

- Backend: https://github.com/saadamir1/mushaf-platform-BE  
- Swagger: http://localhost:3000/api/docs
