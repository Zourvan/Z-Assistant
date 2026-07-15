# NEXX Tab

A **Google Chrome** New Tab extension for everyday browsing and planning — bookmarks, tasks, calendar, timers, and developer tools on one page.

**Version:** 1.9.0

## Goal

Replace the default New Tab with a simple, friendly dashboard that keeps daily essentials — bookmarks, tasks & notes, calendar, clock, timer/alarm, and utility tools — in one place.

## Features

### Bookmarks

- Sync with Chrome bookmarks
- Custom icon and color per bookmark
- Drag-and-drop reordering
- Folder navigation and group-by controls
- Search and browse bookmark tiles

### Tasks & Notes

- Unified list for todos and notes
- Filters: all / todo / note / scheduled
- Due dates, colors, and emoji labels
- Add and edit with a clean, compact UI
- Persisted in IndexedDB
- Full English and Persian (fa) localization

### Clock & Calendar

- Live clock with date display
- Gregorian and Persian (Jalali) calendars
- Configurable first day of week and weekend days
- Task/note markers on scheduled calendar days
- Day click opens a modal with that day’s items and quick-add
- Shared `TasksProvider` keeps calendar and task list in sync

### Weather

- Location search by city, region, and country (Open-Meteo, no API key in extension)
- Current conditions with Lucide SVG icons, humidity, and wind
- 7-day forecast table
- Location and weather data cached in `chrome.storage.local` (30 min / 6 h refresh)
- English and Persian (fa) localization

### Timer & Alarm

- Countdown timer with presets
- Alarms with repeat schedules, sound, and browser notifications
- Pomodoro mode: focus/break phases, progress ring, round tracker, custom durations
- Alarms persisted in IndexedDB and included in backup export/import

### Tools (modal)

Opened from a floating button. Sidebar navigation with categories: **General**, **DevOps**, and **Programming**. Compact split input/output layout.

#### Date & Time Toolkit (General)

Search and group filters across 20 sub-tools:

| Group | Tools |
| --- | --- |
| Calendar | Jalali / Gregorian / Hijri conversion, date formatting |
| Calculator | Add/subtract dates, date difference, business days, weekday, age, leap year |
| Time | Time calculator, add duration to clock, duration, time units, timezone, countdown, relative time |
| Developer | Unix timestamp, cron expressions, date range generator, ISO week |
| Occasions | Holidays and occasions lookup |

#### Encoding & Cryptography Toolkit (General)

Search and group filters. Available today:

| Group | Tools |
| --- | --- |
| Encoding | Base64 (text/file/image), URL, HTML entities, Unicode, ASCII, hex text, number bases, Morse, NATO phonetic |
| Hash | SHA, CRC, HMAC |
| Encryption | AES-GCM |
| Security | Password generator, strength checker, passphrase, JWT, TOTP, UUID, secrets, random bytes |
| Utilities | QR code, slug, case converter, multi-format escape |

Placeholder cards (coming soon): MD5, BLAKE2, RSA, ChaCha20, ECC, PGP, certificates/PEM/CSR/SSH, barcode, and related items.

#### Other tools

- **JSON formatter** (DevOps)
- **Color converter** — HEX, RGB, RGBA, HSL, HSLA with visual picker (Programming)
- **Regex tester** (Programming)

### Settings

Sections: General · Calendar · Appearance · Backgrounds · Data

- Language: English and Persian (RTL/LTR)
- Calendar type (Gregorian / Persian) and related options
- Theme presets, text/background colors
- Backgrounds: built-in images/GIFs, solid colors, custom uploads
- Data: export/import backup for bookmarks, tasks, alarms, and settings

### Layout & UX

- Responsive dashboard: mobile (1 column), tablet (2), desktop (3)
- Clock/Calendar and Timer/Alarm in a shared time column
- Settings and Tools triggers in a frosted control panel
- Social links credit strip

## Roadmap

### Done

- [x] Bookmark icon, color, and reorder
- [x] UI quality and responsive layout
- [x] Clock, alarm, timer, and Pomodoro
- [x] Date conversion (Jalali / Gregorian / Hijri) and full Date & Time toolkit
- [x] Tasks linked to calendar (markers + day modal)
- [x] Tools modal with Encoding & Cryptography toolkit
- [x] English / Persian i18n with RTL support
- [x] Theme and background customization
- [x] IndexedDB persistence and backup export/import

### Planned

- [ ] Holidays and events on the main calendar widget
- [ ] Settings structure refinements
- [ ] Crypto and fiat price display
- [x] Weather status
- [ ] Instagram page
- [ ] Load core data from server APIs
- [ ] Full settings unification (colors, forms, etc.)
- [ ] Google account sync for settings
- [ ] Remaining Encoding & Cryptography placeholders (RSA, PGP, certificates, etc.)

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
npm run build:extension
```

### Install in Chrome

1. Run `npm run build:extension`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. If you previously loaded the project root, **Remove** that extension.
5. Click **Load unpacked** and select the **`dist`** folder.

> **Important:** Load only the `dist` folder. Loading the project root (`Z-Assistant`) causes Chrome to read `/src/main.tsx` and fail with a MIME type error:
> `Expected a JavaScript module but got application/octet-stream`

### Development

```bash
npm run dev      # browser preview (not as an extension)
```

After code changes: run `npm run build:extension`, then click **Reload** on `chrome://extensions`.

---

This project is under active development. See [CHANGELOG.md](./CHANGELOG.md) for recent changes.
