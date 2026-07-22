# NEXX Tab

![NEXX Tab dashboard preview](./readme-files/baner.gif)

A **Google Chrome** New Tab extension for everyday browsing and planning — bookmarks, tasks, calendar, weather, timers, and 100+ utility tools on one page.

**Version:** 1.10.5

## Goal

Replace the default New Tab with a simple, friendly dashboard that keeps daily essentials — bookmarks, tasks & notes, calendar, clock, weather, timer/alarm, and utility tools — in one place.

## Features

### Bookmarks

- Sync with Chrome bookmarks API
- Custom icon (emoji) and tile color per bookmark or folder
- Drag-and-drop reordering
- Folder navigation with breadcrumb history
- Group by: none, A–Z, or type (folders vs bookmarks)
- Search with optional recursive subfolder search
- Configurable tile count in settings
- Ctrl+click opens links in a new tab

### Tasks & Notes

- Unified list for todos and notes
- Filters: all / todo / note / scheduled
- Due dates, colors, and emoji labels
- Add and edit with a compact UI
- Persisted in IndexedDB
- Full English and Persian (fa) localization

### Clock & Calendar

- Live clock with date display
- Gregorian and Persian (Jalali) calendars
- Configurable first day of week and weekend days (up to 3)
- Weekend day highlighting with custom color
- Task/note markers on scheduled calendar days
- Day click opens a modal with that day’s items and quick-add
- Shared `TasksProvider` keeps calendar and task list in sync

### Weather

- Location search by city, region, and country (Open-Meteo — no API key required)
- Current conditions with Lucide SVG icons, humidity, and wind
- Expandable 7-day forecast table
- Location and weather data cached in `chrome.storage.local` (30 min / 6 h refresh)
- Tasks panel hides while forecast is open for a cleaner layout
- English and Persian (fa) localization

### Timer & Alarm

- Countdown timer with presets
- Alarms with repeat schedules (once, daily, weekdays, weekends), sound, and browser notifications
- Pomodoro mode: focus/break phases, progress ring, round tracker, custom durations
- Alarms persisted in IndexedDB and included in backup export/import
- Active timer state survives page reload via localStorage

### Tools (modal)

Opened from a floating button in the control panel. Sidebar with **Recent**, **Favorites**, and category groups (**General**, **Programming**). Each toolkit has search, group filters, and a split input/output layout. Star any sub-tool to pin it to Favorites.

Three top-level toolkits:

| Toolkit | Category | Sub-tools |
| --- | --- | --- |
| Date & Time Toolkit | General | 20 |
| Encoding & Cryptography | General | 38 (25 available, 13 coming soon) |
| Developer Toolkit | Programming | 58 |

### Settings

Sections: **General** · **Calendar** · **Appearance** · **Backgrounds** · **Data**

- **General:** Language (English / Persian with RTL/LTR), bookmark tile count
- **Calendar:** Calendar type (Gregorian / Persian), first day of week, weekend days
- **Appearance:** Theme presets (Classic, Dark, Ocean, …), text/background colors, font size scale
- **Backgrounds:** Built-in images/GIFs, solid colors, gradients, custom uploads (IndexedDB), image URL import
- **Data:** Export/import JSON backup for bookmarks, tasks, alarms, and settings

### Layout & UX

- Responsive dashboard: mobile (1 column), tablet (2), desktop (3)
- Clock/Calendar and Timer/Alarm in a shared time column
- Weather and Tasks share the middle column
- Settings and Tools triggers in a frosted control panel
- Social links credit strip
- Theme colors applied consistently across widgets and modals

## Tools reference

### Date & Time Toolkit (General) — 20 tools

| Group | Tool | Status |
| --- | --- | --- |
| Calendar | Calendar Converter (Jalali / Gregorian / Hijri) | ✓ |
| Calendar | Date Format (ISO, compact, long, …) | ✓ |
| Date Calculator | Add / Subtract Date | ✓ |
| Date Calculator | Date Difference | ✓ |
| Date Calculator | Business Days | ✓ |
| Date Calculator | Weekday | ✓ |
| Date Calculator | Age Calculator | ✓ |
| Date Calculator | Leap Year | ✓ |
| Time | Time Calculator | ✓ |
| Time | Add Duration to Time | ✓ |
| Time | Duration | ✓ |
| Time | Time Unit Converter | ✓ |
| Time | Time Zone | ✓ |
| Time | Countdown | ✓ |
| Time | Relative Time | ✓ |
| Developer | Unix Timestamp | ✓ |
| Developer | Cron Helper | ✓ |
| Developer | Date Range | ✓ |
| Developer | ISO Week | ✓ |
| Occasions | Occasions (holidays & cultural events) | ✓ |

### Encoding & Cryptography Toolkit (General) — 38 tools

| Group | Tool | Status |
| --- | --- | --- |
| Encoding | Base64 (text / file / image) | ✓ |
| Encoding | URL Encode | ✓ |
| Encoding | HTML Encode | ✓ |
| Encoding | Unicode | ✓ |
| Encoding | ASCII Converter | ✓ |
| Encoding | Hex Text | ✓ |
| Encoding | Number Bases | ✓ |
| Encoding | Morse Code | ✓ |
| Encoding | NATO Alphabet | ✓ |
| Hash | SHA Family | ✓ |
| Hash | CRC / Checksum | ✓ |
| Hash | HMAC | ✓ |
| Hash | MD5 | Soon |
| Hash | BLAKE2 | Soon |
| Encryption | AES (AES-GCM) | ✓ |
| Encryption | RSA | Soon |
| Encryption | ChaCha20 | Soon |
| Encryption | ECC | Soon |
| Encryption | PGP | Soon |
| Security | Password Generator | ✓ |
| Security | Password Strength | ✓ |
| Security | Passphrase | ✓ |
| Security | JWT Tools | ✓ |
| Security | TOTP / OTP | ✓ |
| Security | UUID | ✓ |
| Security | Secret Generator | ✓ |
| Security | Random Generator | ✓ |
| Certificates | PEM / DER | Soon |
| Certificates | CSR Generator | Soon |
| Certificates | Certificate Viewer | Soon |
| Certificates | SSH Keys | Soon |
| Certificates | Fingerprint | Soon |
| Certificates | OpenSSL Helper | Soon |
| Utilities | QR Code | ✓ |
| Utilities | Barcode | Soon |
| Utilities | Slug Generator | ✓ |
| Utilities | Case Converter | ✓ |
| Utilities | Escape Characters | ✓ |

### Developer Toolkit (Programming) — 58 tools

| Group | Tool | Status |
| --- | --- | --- |
| Data Converter | JSON Formatter | ✓ |
| Data Converter | YAML ↔ JSON | ✓ |
| Data Converter | XML Formatter & Converter | ✓ |
| Data Converter | CSV Viewer & Converter | ✓ |
| Data Converter | TOML Converter | ✓ |
| Data Converter | INI Parser | ✓ |
| Text Tools | Diff Checker | ✓ |
| Text Tools | Case Converter | ✓ |
| Text Tools | Slug Generator | ✓ |
| Text Tools | Lorem Ipsum Generator | ✓ |
| Text Tools | Text Statistics | ✓ |
| Text Tools | Line Sorter | ✓ |
| Text Tools | Remove Duplicate Lines | ✓ |
| Code Tools | Code Formatter (JS, TS, HTML, CSS, SQL, …) | ✓ |
| Code Tools | Code Minifier | ✓ |
| Code Tools | Escape / Unescape | ✓ |
| Code Tools | Regex Tester | ✓ |
| Code Tools | Regex Generator | ✓ |
| Web Tools | URL Parser | ✓ |
| Web Tools | Query Parameter Editor | ✓ |
| Web Tools | HTTP Status Codes | ✓ |
| Web Tools | MIME Type Lookup | ✓ |
| Web Tools | User-Agent Parser | ✓ |
| API Tools | cURL Parser | ✓ |
| API Tools | cURL Generator | ✓ |
| API Tools | JWT Decoder | ✓ |
| API Tools | GraphQL Formatter | ✓ |
| API Tools | OpenAPI Viewer | ✓ |
| DevOps | chmod Calculator | ✓ |
| DevOps | Semantic Version Calculator | ✓ |
| DevOps | Gitignore Generator | ✓ |
| DevOps | Conventional Commit Generator | ✓ |
| DevOps | Docker Ignore Generator | ✓ |
| DevOps | Docker Image Tag Builder | ✓ |
| DevOps | Kubernetes Resource Converter | ✓ |
| DevOps | Environment Variable Editor | ✓ |
| Network | CIDR Calculator | ✓ |
| Network | IP Converter | ✓ |
| Network | Subnet Calculator | ✓ |
| Network | DNS Record Builder | ✓ |
| Frontend | Color Picker (HEX, RGB, HSL, HSV) | ✓ |
| Frontend | CSS Gradient Generator | ✓ |
| Frontend | Box Shadow Generator | ✓ |
| Frontend | Border Radius Generator | ✓ |
| Frontend | CSS Unit Converter | ✓ |
| Frontend | Flexbox Playground | ✓ |
| Frontend | CSS Grid Generator | ✓ |
| Frontend | SVG Optimizer | ✓ |
| AI Developer | Token Counter | ✓ |
| AI Developer | Markdown Preview | ✓ |
| AI Developer | Markdown Table Generator | ✓ |
| AI Developer | Mermaid Preview | ✓ |
| AI Developer | JSON Schema Validator | ✓ |
| Utility | UUID Generator | ✓ |
| Utility | NanoID Generator | ✓ |
| Utility | Random Generator | ✓ |
| Utility | Byte Converter | ✓ |
| Utility | Number Base Converter | ✓ |

## Roadmap

### Done

- [x] Bookmark icon, color, and reorder
- [x] UI quality and responsive layout
- [x] Clock, alarm, timer, and Pomodoro
- [x] Date conversion (Jalali / Gregorian / Hijri) and full Date & Time toolkit
- [x] Tasks linked to calendar (markers + day modal)
- [x] Encoding & Cryptography toolkit
- [x] Developer Toolkit (JSON, YAML, regex, diff, JWT, cURL, DevOps, network, CSS, AI tools, …)
- [x] Tools favorites and recent history
- [x] English / Persian i18n with RTL support
- [x] Theme and background customization
- [x] IndexedDB persistence and backup export/import
- [x] Weather widget

### Planned

- [ ] Holidays and events on the main calendar widget
- [ ] Settings structure refinements
- [ ] Crypto and fiat price display
- [ ] Instagram page
- [ ] Load core data from server APIs
- [ ] Full settings unification (colors, forms, etc.)
- [ ] Google account sync for settings
- [ ] Remaining Encoding & Cryptography placeholders (MD5, RSA, PGP, certificates, barcode, …)

## Future ideas

### Productivity & time

- Productivity dashboard (weather, daily tasks, reminders)
- Google Calendar integration
- Dynamic daily checklist, gamification, focus mode
- Personal in-page search

### Data & insights

- News, crypto/stock widgets, AI daily outlook, price comparison

### Learning & personal growth

- Daily vocabulary, learning dashboard, writing mood analysis

### Visual inspiration

- Inspirational images and daily quotes (e.g. Persian poems / Hafez sources)
- Font and color personalization

### Habits & digital health

- Habit tracking and contribution-style graphs
- Distraction blockers and usage awareness

### More utilities

- Link shortener, AI article summarizer, multi-engine search
- Personal API hooks (Trello, Gmail, GitHub, …)

## Tech stack

React · TypeScript · Vite · Tailwind CSS · Material UI · IndexedDB · i18next · Lucide icons

## Getting started

```bash
npm install
```

### npm scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server — browser preview (not loaded as an extension) |
| `npm run build` | Production build to `dist/` |
| `npm run build:extension` | Build extension and print load-unpacked instructions |
| `npm run build:extension-package` | Build extension and create a Chrome Web Store zip in `release/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

### Install in Chrome (development)

1. Run `npm run build:extension`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. If you previously loaded the project root, **Remove** that extension.
5. Click **Load unpacked** and select the **`dist`** folder.

> **Important:** Load only the `dist` folder. Loading the project root (`Z-Assistant`) causes Chrome to read `/src/main.tsx` and fail with a MIME type error:
> `Expected a JavaScript module but got application/octet-stream`

After code changes: run `npm run build:extension`, then click **Reload** on `chrome://extensions`.

### Publish to Chrome Web Store

1. Run `npm run build:extension-package`.
2. Upload the generated zip from `release/` (e.g. `nexx-tab-v1.10.5.zip`) in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) → your item → **Package** → **Upload new package**.

---

This project is under active development. See [CHANGELOG.md](./CHANGELOG.md) for recent changes.

## Next features

### Search engine picker
Choose which search engine runs queries from the New Tab (Google, DuckDuckGo, Brave to start). More engines can be added based on user feedback.

### Birthday profile
Set your birthday in Settings → Profile. On your birthday, get a surprise gift experience and birthday-related stats.

### Calendar occasion filters
In Settings → Calendar, pick which occasion types appear on the calendar so unwanted holidays/events stay hidden.

### News widgets
Serious news feeds from [Davvvat](https://davvvat.ir/?utm_source=dastyar&utm_medium=widget&utm_campaign=new-launch) and [Daste Aval](https://dasteaval.news/news/).

### Google Calendar sync
Connect Google Calendar so events show alongside the local calendar widget.

### Multi-service search
Search across popular services from the New Tab — Digikala, Novatel, Houshang, Maniro, Monaghese Jadid, YouTube, Divar, and more.


امکان ایجاد یک سیستم یادآوری (Reminder) برای بوکمارک‌ها فراهم شود؛ به‌گونه‌ای که کاربر بتواند برای هر بوکمارک تاریخ و ساعت مشخصی تعیین کند. در زمان تعیین‌شده، سیستم با ارسال یک اعلان (Notification) یا آلارم، مطالعه یا بررسی آن بوکمارک را به کاربر یادآوری کند.
