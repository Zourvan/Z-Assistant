# CHANGELOG

## 2026-07-18 12:30:04
- Restored themed background on the prompt input bar (`--theme-bg`) while keeping the wrap transparent
- Components affected: src/components/AiPromptBar.css

## 2026-07-18 12:10:26
- Prompt bar tabs aligned to the right with soft pill corners; removed wrap/bar background fill
- Components affected: src/components/AiPromptBar.tsx, src/components/AiPromptBar.css

## 2026-07-18 11:29:27
- Restyled prompt-bar tabs: flush to one side, no container chrome, sliding accent indicator and mode-switch animation
- Components affected: src/components/AiPromptBar.tsx, src/components/AiPromptBar.css

## 2026-07-18 10:59:44
- Added AI Chat / Search tabs above the prompt bar with Google, Digikala, and Divar search targets
- Components affected: src/components/AiPromptBar.tsx, src/components/AiPromptBar.css, src/components/aiPromptBar/, src/i18n/locales

## 2026-07-18 09:55:58
- AI prompt input now switches to RTL/right-align when Persian text is entered (same content detection as tasks)
- Components affected: src/components/AiPromptBar.tsx, src/components/AiPromptBar.css

## 2026-07-17 11:49:22
- Background images now fill the viewport with `cover` (scale uniformly, no stretch) via a fixed full-screen layer
- Components affected: src/App.tsx, src/App.css

## 2026-07-17 11:49:18
- Fixed Pet Mode crash when opening Appearance settings (`variants` undefined after on/off toggle event)
- Components affected: src/features/corgi/CorgiSettings.ts, src/features/corgi/CorgiLayer.tsx, src/components/settings/SettingsPanel.tsx

## 2026-07-17 11:30:00
- Added selectable pet variants: Charles Corgi, Nano Corgi (CodePen OZZyxp), Husky (harshalparmar/husky), and Alex Husky (Codrops AnimatedAnimals)
- Pet Mode settings now support multi-select breeds plus global size and speed sliders; choices sync across devices
- Components affected: src/features/corgi/, src/components/settings/SettingsPanel.tsx, src/i18n/locales

## 2026-07-17 11:00:09
- Added gear-driven boot loading page (CodePen raMyGRY by yongtaozheng) shown on new-tab open until the dashboard is ready
- Components affected: src/components/LoadingPage.tsx, src/components/LoadingPage.css, src/App.tsx, src/i18n/locales

## 2026-07-17 02:22:36
- Halved Charles corgi size again (42×30) and added a sitting pose that it occasionally uses while crossing the page
- Components affected: src/features/corgi/charlesMarkup.ts, src/features/corgi/CharlesCorgi.css, src/features/corgi/Corgi.ts

## 2026-07-17 02:15:46
- Halved Charles corgi size (84×60) for a less dominant overlay
- Components affected: src/features/corgi/charlesMarkup.ts, src/features/corgi/CharlesCorgi.css

## 2026-07-17 02:14:13
- Added a diagonal walk-cycle for Charles corgi legs while moving (paws step in opposite pairs; gait speed matches travel speed)
- Components affected: src/features/corgi/CharlesCorgi.css, src/features/corgi/Corgi.ts

## 2026-07-17 02:10:02
- Replaced Corgi Mode art with Charles the CSS Corgi (CodePen aNmoYR by JayJay89): pure CSS structure with blink, ear wiggle, tail wag, and tongue animations while walking across the page
- Components affected: src/features/corgi/Corgi.ts, src/features/corgi/charlesMarkup.ts, src/features/corgi/CharlesCorgi.css, src/features/corgi/CorgiLayer.css

## 2026-07-17 01:57:38
- Made Pomodoro Customize durations overlay background fully opaque so underlying text no longer shows through
- Components affected: src/components/TimerAlarm.css

## 2026-07-17 01:55:00
- Rescaled base font size so the old 85% is the new 100% standard (16px → 13.6px baseline)
- Added one-time migration to reset previously stored font size ratio to 100%
- Components affected: src/index.css, src/components/ThemeProvider.tsx

## 2026-07-17 01:53:24
- Redrew Corgi Mode sprites in a polished sticker style (soft outlines, cream head, fluffy rump, proper stubby legs) instead of the rough placeholder art
- Components affected: src/features/corgi/assets/, scripts/generate-corgi-sprites.mjs, src/features/corgi/sprites.ts, src/features/corgi/CorgiLayer.css, src/features/corgi/Corgi.ts

## 2026-07-17 01:50:59
- Made Pomodoro panel more compact (smaller ring, tighter spacing)
- Customize durations now opens as an overlay on the panel instead of expanding below
- Components affected: src/components/timerAlarm/PomodoroPanel.tsx, src/components/TimerAlarm.css

## 2026-07-17 01:43:02
- Appearance: color picker now follows the active theme and keeps hex/rgb codes readable
- Added separate Text Outline Color control (replaces fixed black text shadow)
- Users can save, apply, and delete named custom themes (synced + included in backup)
- Components affected: src/components/ThemeProvider.tsx, src/components/settings/SettingsPanel.tsx, src/components/settings/themePresets.ts, src/components/settings/settingsSync.ts, src/components/Settings.css, src/index.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-17 01:42:30
- Fixed Corgi Mode not showing pets: no longer blocked by prefers-reduced-motion, layer stays mounted, and the first corgi spawns immediately when enabled
- Components affected: src/features/corgi/CorgiLayer.tsx, src/features/corgi/CorgiLayer.css, src/features/corgi/CorgiManager.ts, src/features/corgi/Corgi.ts, src/features/corgi/SpriteAnimator.ts

## 2026-07-17 01:41:17
- Fixed Timer / Pomodoro / Alarm panel height so switching tabs no longer resizes the card
- Components affected: src/components/TimerAlarm.css

## 2026-07-17 01:35:19
- Search results now include matching folders again (not only bookmarks with URLs)
- Components affected: src/components/Bookmarks.tsx

## 2026-07-17 01:32:13
- Unified select-box styles with First Day of the Week: near-opaque menu background (`--theme-menu-bg`) plus blur so text behind is less visible
- Shared styles in `src/components/shared/themedSelect.css` for all bookmark selects (Group / Sort / Search in)
- Components affected: src/components/settings/themeUtils.ts, src/components/shared/themedSelect.css, src/components/Bookmarks.css, src/components/Bookmarks.tsx, src/components/Settings.css

## 2026-07-17 01:30:25
- Added Sort by → Type (folders first, then bookmarks, A–Z within each)
- Components affected: src/components/Bookmarks.tsx, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-17 01:29:16
- Added Corgi Mode Easter egg (Google Colab–inspired): animated corgis stroll across the new tab when enabled under Appearance → Animations
- Lightweight sprite-sheet system with walk/idle/sit/bark/sleep states, max 3 pets, pauses when the tab is hidden, and respects prefers-reduced-motion
- Components affected: src/features/corgi/, src/App.tsx, src/components/settings/SettingsPanel.tsx, src/components/settings/settingsSync.ts, src/components/Settings.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-17 01:27:32
- Moved the themed "Search in" select to sit immediately before the search text box
- Components affected: src/components/Bookmarks.tsx

## 2026-07-17 01:26:38
- Added brand icons beside each AI provider name in the prompt bar selector and dropdown
- Components affected: src/components/aiPromptBar/icons.tsx, src/components/AiPromptBar.tsx, src/components/AiPromptBar.css

## 2026-07-17 01:26:09
- Made the Bookmarks magnifier icon more visible: larger size, stronger stroke, and a surface button with border
- Components affected: src/components/Bookmarks.css, src/components/Bookmarks.tsx

## 2026-07-17 01:24:24
- Fixed bookmark Group/Sort/Search-in selects so labels and options use theme text/background colors (custom dropdowns instead of native selects)
- Components affected: src/components/Bookmarks.tsx, src/components/Bookmarks.css

## 2026-07-17 01:21:21
- Moved "Search in" (All / Name / Address) into a select next to the search box; typing a query lists every matching bookmark across the full tree
- Components affected: src/components/Bookmarks.tsx

## 2026-07-17 01:19:39
- Replaced bookmark "Group by" toggle buttons with compact select boxes on the left of the search field, and added a "Sort by" select (Default / Name A–Z / Name Z–A)
- Components affected: src/components/Bookmarks.tsx, src/components/Bookmarks.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-17 01:14:43
- AI prompt bar now opens the selected provider in the same tab and uses auto-start URL patterns (`?q=`) so ChatGPT/Claude/Perplexity begin answering after Enter/Send
- Components affected: src/components/AiPromptBar.tsx, src/components/aiPromptBar/providers.ts

## 2026-07-17 01:09:16
- Added bottom AI prompt bar to quickly continue a conversation in ChatGPT, Claude, Gemini, Grok, Perplexity, DeepSeek, or Copilot with the prompt pre-filled via URL
- Remembers the last selected AI provider; Enter sends, Shift+Enter inserts a new line
- Components affected: src/components/AiPromptBar.tsx, src/components/AiPromptBar.css, src/components/aiPromptBar/providers.ts, src/App.tsx, src/App.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-17 01:04:52
- Added All / Name / Address toggle in the bookmark search modal to choose what field to search
- Components affected: src/components/Bookmarks.tsx, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-17 00:54:43
- Search magnifier now opens a Choose-bookmark style modal; results match name/address and clicking a bookmark navigates to it
- Components affected: src/components/Bookmarks.tsx, src/components/Bookmarks.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-17 00:45:29
- Added magnifier search next to the Bookmarks title to filter tiles by name or address (URL/hostname)
- Components affected: src/components/Bookmarks.tsx, src/components/Bookmarks.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-15 16:20:00
- Fixed ERR_FILE_NOT_FOUND for missing favicon and bundled background images in the Chrome extension by resolving assets via chrome.runtime.getURL
- Components affected: index.html, src/utils/extensionAssetUrl.ts, src/components/settings/defaultBackgrounds.ts, src/components/settings/backgroundUtils.ts, src/App.tsx, src/components/settings/SettingsPanel.tsx

## 2026-07-15 16:15:00
- Fixed Chrome extension icon not showing: added PNG icons (16/32/48/128) and `icons` field in manifest
- Components affected: extension/manifest.json, extension/icons/, vite.config.ts

## 2026-07-15 16:10:00
- Added GitHub Actions release workflow: builds extension zip and publishes GitHub Release on version tag push
- Components affected: .github/workflows/release.yml

## 2026-07-15 15:40:00
- Added cross-device settings sync via chrome.storage.sync: theme, calendar, language, tasks, alarms, bookmarks, backgrounds, pomodoro, tool favorites, and weather location sync when signed into Chrome
- SyncProvider bootstraps on startup and applies remote changes from other devices automatically
- Components affected: src/components/settings/settingsSync.ts, src/components/settings/SyncProvider.tsx, src/main.tsx, src/components/ThemeProvider.tsx, src/components/settings/CalendarContext.tsx, src/i18n/LanguageProvider.tsx, src/components/tasks/TasksContext.tsx, src/components/TimerAlarm.tsx, src/components/Bookmarks.tsx, src/components/settings/SettingsPanel.tsx, src/components/tools/toolPreferences.ts, src/components/timerAlarm/pomodoroUtils.ts, src/components/weather/storage.ts

## 2026-07-15 15:35:00
- Fixed Recent/Favorites: one click now opens the tool and updates recent list at the same time
- Favorites and Recent sidebar items now use the same layout as category tools (icon + label + star)
- Components affected: src/components/tools/ToolsNavigationContext.tsx, src/components/tools/ToolsSidebarLinks.tsx, src/components/tools/ToolkitShell.tsx, src/components/Tools.tsx

## 2026-07-15 15:30:00
- Weather 7-day forecast toggle now smoothly hides Tasks & Notes while expanded and fades them back in when closed
- Components affected: src/App.tsx, src/App.css, src/components/Weather.tsx, src/components/Weather.css

## 2026-07-15 15:25:00
- Weather widget: show daily conditions by default; 7-day forecast expands on click; full column width layout
- Components affected: src/components/Weather.tsx, src/components/Weather.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-15 15:20:00
- Moved Weather widget above Tasks & Notes in the dashboard tasks column
- Components affected: src/App.tsx

## 2026-07-15 15:15:00
- Fixed Tools modal crash (Cannot access before initialization) caused by circular imports in recent/favorites catalog
- Components affected: src/components/tools/toolCatalog.ts, src/components/tools/toolRefKey.ts, src/components/tools/ToolsNavigationContext.tsx, src/components/tools/ToolkitShell.tsx

## 2026-07-15 15:10:00
- Added Recent Tools (last 10 used) and Favorite Tools sections to Tools sidebar with localStorage persistence
- Star buttons on sidebar items and toolkit cards to favorite tools; quick navigation from recent/favorites opens sub-tools directly
- Components affected: src/components/Tools.tsx, src/components/tools/ToolsNavigationContext.tsx, src/components/tools/ToolsQuickList.tsx, src/components/tools/toolCatalog.ts, src/components/tools/toolPreferences.ts, src/components/tools/ToolkitShell.tsx, src/components/Tools.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-15 15:00:00
- Added Weather widget to the New Tab dashboard: location search, current conditions, 7-day forecast, chrome.storage cache (30 min current / 6 h forecast), and Lucide SVG weather icons via Open-Meteo (no API key in extension)
- Components affected: src/components/Weather.tsx, src/components/weather/**, src/App.tsx, extension/manifest.json, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-15 14:50:00
- Renamed sidebar Tools category DevOps to Programming and removed empty Programming section
- Components affected: src/components/tools/registry.ts, src/components/tools/types.ts, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-15 14:45:00
- Added Developer Toolkit with 58 sub-tools for programmers: JSON/YAML/XML/CSV/TOML converters, text tools, code formatters, regex, web/API utilities, DevOps, network, CSS generators, AI dev tools, and more
- Replaced standalone JSON, Regex, and Color sidebar entries with unified searchable Developer Toolkit
- Components affected: src/components/tools/developer/**, src/components/tools/registry.ts, src/components/Tools.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json, package.json

## 2026-07-15 14:30:00
- Fixed Date & Time Toolkit date picker popover: theme colors now apply to the calendar overlay and day cells are clearly visible
- Components affected: src/components/tools/datetime/ToolDatePicker.tsx, src/components/Tools.css

## 2026-07-15 14:25:00
- Enlarged the Choose bookmark selector modal to show more bookmarks at once
- Components affected: src/components/Bookmarks.tsx

## 2026-07-15 13:05:00
- Date & Time Toolkit: added calendar and time pickers for date/time inputs (Jalali, Gregorian, Hijri mini-calendar + native browser pickers)
- Components affected: src/components/tools/datetime/ToolDatePicker.tsx, src/components/tools/datetime/panels/*, src/components/Tools.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-15 12:49:00
- Added recursive search checkbox in bookmark search; when enabled, search includes all subfolders
- Preference is remembered between sessions
- Components affected: src/components/Bookmarks.tsx, src/components/Bookmarks.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-15 12:44:00
- Added clickable folder breadcrumb path when browsing bookmarks in the selector and folder viewer
- Each folder segment in the path navigates to that level; root returns to all bookmarks
- Components affected: src/components/Bookmarks.tsx, src/components/Bookmarks.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-15 08:57:22
- Consolidated encoding and cryptography utilities into a single Encoding & Cryptography toolkit with search and group filters (Encoding, Hash, Encryption, Security, Certificates, Utilities)
- Available tools include Base64 (file/image), URL/HTML/Unicode/ASCII/Hex/Morse/NATO, number bases, SHA/HMAC/CRC, AES-GCM, password/passphrase/strength, JWT, TOTP, UUID, secrets/random, QR, slug, case converter, and multi-format escape
- Placeholder cards for RSA, PGP, certificates, SSH, barcode, MD5, and related items until implemented
- Components affected: src/components/tools/encoding/*, src/components/tools/ToolkitShell.tsx, src/components/tools/registry.ts, src/components/Tools.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-15 08:45:00
- Expanded Date Converter into a full Date & Time Toolkit with 20 sub-tools: calendar conversion (Jalali/Gregorian/Hijri), date calculator, time calculator, Unix timestamp, timezone, cron, ISO week, occasions, and more
- Added search and category filters inside the toolkit for quick tool discovery; merged standalone Timestamp tool into the hub
- Components affected: src/components/tools/datetime/*, src/components/tools/DateConverter.tsx, src/components/tools/registry.ts, src/components/Tools.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-14 23:16:00
- Added Pomodoro timer tab with focus/break phases, progress ring, round tracker, and customizable durations
- Components affected: src/components/TimerAlarm.tsx, src/components/TimerAlarm.css, src/components/timerAlarm/PomodoroPanel.tsx, src/components/timerAlarm/pomodoroUtils.ts, src/components/timerAlarm/types.ts, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-14 23:04:22
- Grouped Settings and Tools triggers in the same frosted panel style as social links (rounded box, blur, shadow)
- Components affected: src/App.tsx, src/App.css, src/components/settings/SettingsPanel.tsx, src/components/Tools.tsx, src/components/Settings.css, src/components/Tools.css

## 2026-07-14 22:57:49
- Enlarged social links column: removed scale-down transform, bigger icons and credit text for better visibility
- Components affected: src/components/SocialLinks.tsx, src/components/SocialLinks.css

## 2026-07-14 23:00:00
- Redesigned Tasks & Notes: filters (all/todo/note/scheduled), due dates, cleaner add/edit UI, full fa/en i18n
- Calendar shows task/note markers on scheduled days; clicking a day opens a modal with that day's items and quick-add form
- Shared TasksProvider syncs tasks between calendar and list via IndexedDB
- Components affected: src/components/TasksAndNotes.tsx, src/components/TasksAndNotes.css, src/components/Calendar.tsx, src/components/tasks/*, src/main.tsx, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-14 22:50:00
- Redesigned all Tools panels for compact no-scroll layout: split input/output columns, smaller sidebar, removed intro header
- Unified ToolWorkspace/ToolToolbar layout system; textareas fill available height with internal scroll only
- Components affected: src/components/Tools.tsx, src/components/Tools.css, src/components/tools/shared.tsx, src/components/tools/*.tsx

## 2026-07-14 22:45:00
- Redesigned Password Generator layout: single-column flow, slider + length input, toggle grid, full-width generate button, dedicated result card
- Components affected: src/components/tools/PasswordGenerator.tsx, src/components/Tools.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-14 22:40:00
- Redesigned Tools modal with sidebar navigation, tool descriptions, and polished visual hierarchy
- Moved Color Converter to Programming category; improved color tool with hero preview and format output list
- Components affected: src/components/Tools.tsx, src/components/Tools.css, src/components/tools/shared.tsx, src/components/tools/ColorConverter.tsx, src/components/tools/registry.ts, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-14 22:35:00
- Added Color Converter tool (HEX, RGB, RGBA, HSL, HSLA) with visual picker in General category
- Moved Tools floating button below Settings (top-right stack)
- Components affected: src/components/tools/ColorConverter.tsx, src/components/tools/registry.ts, src/components/Tools.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-14 22:30:00
- Converted Tools from inline dashboard widget to a modal opened via a floating button (bottom-left)
- Close with X button, overlay click, or Escape key
- Components affected: src/components/Tools.tsx, src/components/Tools.css, src/App.tsx, src/App.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-14 22:25:00
- Added Tools widget with three categories: General, DevOps, and Programming
- General: Jalali/Gregorian date converter, timestamp converter, Base64, password generator
- DevOps: JSON formatter, URL encoder, UUID generator, SHA hash generator
- Programming: Regex tester, number base converter, string escape, JWT decoder
- Components affected: src/components/Tools.tsx, src/components/Tools.css, src/components/tools/, src/App.tsx, src/App.css, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-14 22:12:00
- Increased embedded calendar day number size for better readability
- Components affected: src/components/Calendar.tsx

## 2026-07-14 22:08:00
- Reduced Clock/Calendar and Timer/Alarm height after responsive layout made them too tall
- Capped widget width, replaced calendar aspect-square cells with fixed-size days, tightened spacing
- Components affected: src/components/ClockCalendar.tsx, src/components/ClockCalendar.css, src/components/Clock.tsx, src/components/Calendar.tsx, src/components/TimerAlarm.css, src/App.css

## 2026-07-14 22:05:00
- Made the full dashboard responsive with adaptive grid layout across mobile, tablet, and desktop
- Mobile: single column stack; tablet: two columns with full-width bookmarks; desktop: three columns
- Improved widget overflow handling, bookmark grid auto-fill, and mobile-friendly controls
- Components affected: src/App.tsx, src/App.css, src/index.css, src/components/ClockCalendar.tsx, src/components/TasksAndNotes.tsx, src/components/TimerAlarm.css, src/components/Bookmarks.css, src/components/Bookmarks.tsx, src/components/Settings.css, src/components/SocialLinks.tsx, src/components/SocialLinks.css

## 2026-07-14 22:01:00
- Swapped layout order: Clock/Calendar now above Timer/Alarm in the first column
- Components affected: src/App.tsx

## 2026-07-14 22:00:00
- Merged Clock and Calendar into a single compact card to free vertical space for Timer/Alarm
- Timer/Alarm moved above the time widget and given full column width
- Components affected: src/components/ClockCalendar.tsx, src/components/Clock.tsx, src/components/Calendar.tsx, src/App.tsx, src/components/TimerAlarm.css

## 2026-07-14 21:52:00
- Added Timer and Alarm widget with countdown, presets, repeat schedules, sound, and notifications
- Placed below Clock in the time column; alarms persist in IndexedDB and export/import backup
- Components affected: src/components/TimerAlarm.tsx, src/components/TimerAlarm.css, src/components/timerAlarm/, src/App.tsx, src/components/settings/settingsDb.ts, src/components/settings/SettingsPanel.tsx, src/i18n/locales/en/translation.json, src/i18n/locales/fa/translation.json

## 2026-07-14 21:39:03
- Improved spacing and layout of the Group by controls in the Choose bookmark modal
- Stacked label above full-width toggle buttons with clearer separation from search
- Components affected: src/components/Bookmarks.tsx, src/components/Bookmarks.css

## 2025-05-23 01:54:07
- Enhanced UI in TasksAndNotes component by improving organization and styling
- Made Select components (color and emoji) more consistent in appearance
- Removed dropdown arrows from all Select components for cleaner interface
- Centered task controls for better visual alignment
- Standardized the size and appearance of all selector controls
- Components affected: src/components/TasksAndNotes.tsx

## 2025-05-23 01:42:28
- Standardized font sizes across bookmark and folder tiles in Bookmarks component
- Changed bookmark tile font size from text-[0.8vh] to text-xs to match folder tiles
- Removed responsive text size variations (sm:text-xs) in folder content view for consistency
- Ensured consistent typography across all bookmark and folder elements
- Components affected: src/components/Bookmarks.tsx

## 2025-05-23 01:38:33
- Modified background image display to show images clearly without filters or overlays
- Removed backdrop blur effect from the main container
- Made background container transparent when an image is displayed
- Simplified loading state visual feedback
- Components affected: src/App.tsx

## 2025-05-23 01:30:56
- Created a new ThemeProvider to centralize theme management (text color and background color)
- Refactored Settings component to use ThemeProvider instead of local state
- Updated App component to apply theme settings globally
- Improved theme reset functionality with a dedicated resetTheme method
- Components affected: src/components/ThemeProvider.tsx, src/components/Settings.tsx, src/App.tsx, src/main.tsx

## 2025-05-23 01:21:54
- Modified group headers in Bookmarks component to scroll with content instead of staying fixed
- Removed sticky positioning from group headers to ensure they move together with their content
- Removed scrollPaddingTop as it's no longer needed without sticky headers
- Components affected: src/components/Bookmarks.tsx

## 2025-05-23 01:10:47
- Fixed sticky positioning of group headers in Bookmarks component
- Enhanced group headers with higher z-index and shadow for better visual separation
- Added scrollPaddingTop to scrollable containers to prevent content from being hidden under sticky headers
- Explicitly added position: sticky in the style attribute to ensure consistent behavior across browsers
- Components affected: src/components/Bookmarks.tsx

## 2025-05-22 22:19:43
- Implemented internationalization (i18n) with support for English and Persian languages
- Created LanguageProvider component to manage language context and text direction
- Added language selection to Settings component
- Updated components to use translations from i18n
- Modified Calendar component to adapt to text direction based on selected language
- Components affected: Settings.tsx, Calendar.tsx, App.tsx, and new i18n files

## 2025-05-22 22:03:11
- Deleted original TodoList.tsx and Notes.tsx components after replacing them with the unified TasksAndNotes component
- Updated App.tsx to use the new unified TasksAndNotes component
- Modified Settings.tsx to handle the unified tasks database
- Updated import/export functionality to work with the new database structure
- Added backward compatibility for importing legacy data formats

## 2025-05-22 21:59:19
- Created a new unified component `TasksAndNotes.tsx` by merging `TodoList.tsx` and `Notes.tsx`
- Added ability to select between note and todo types for each item
- Maintained color selection feature from Notes component
- Maintained emoji selection feature from TodoList component
- Implemented different display modes based on item type (todo or note)
- Created a unified database schema that can handle both types
- Components affected: New `TasksAndNotes.tsx` component

## 2025-05-22 22:32:18
- Combined Language and Calendar Type settings into a single unified control
- Automatically set language based on calendar type (English for Gregorian, Persian for Persian)
- Removed redundant language selection UI
- Improved user experience by simplifying language/calendar settings
- Components affected: src/components/Settings.tsx 

## 2025-05-22 22:42:01
- Fixed RTL/LTR direction issue when switching between languages
- Enhanced language switch mechanism to properly apply text direction
- Updated i18n configuration to better handle language direction changes
- Added explicit direction attributes to UI containers
- Implemented force reflow technique to ensure direction changes apply immediately
Components affected:
- src/i18n/LanguageProvider.tsx
- src/i18n/i18n.ts
- src/components/Settings.tsx 

## 2025-05-22 22:48:21
- Fixed "Maximum call stack size exceeded" error caused by infinite recursion in language change
- Implemented safety mechanisms to prevent recursive calls to changeLanguage
- Added flags to track language change process and avoid duplicate change events
- Refactored language switching logic in LanguageProvider and Settings components
- Fixed initialization sequence for language and direction settings
Components affected:
- src/i18n/i18n.ts
- src/i18n/LanguageProvider.tsx
- src/components/Settings.tsx 

## 2025-05-22 22:57:35
- Added RTL support to SocialLinks component to properly position social links on the left side in RTL languages
- Components affected: SocialLinks.tsx 

## 2025-05-22 23:05:48
- Reverted SocialLinks component to fixed positioning (always right-aligned) regardless of language direction
- Removed language direction dependency from SocialLinks component
- Components affected: SocialLinks.tsx

## 2025-05-23 00:40:49
- Added explicit direction controls to SocialLinks component to completely isolate it from language direction changes
- Applied both HTML dir="ltr" attribute and CSS direction: ltr style to all relevant elements
- Ensures the component always displays correctly regardless of application language setting
- Components affected: SocialLinks.tsx

## 2025-05-22 23:01:17
- Fixed SocialLinks component layout in RTL mode by swapping the order of social links and text
- Social links now appear on the left side of "Nima has built it with ♥" text in RTL mode
- Components affected: SocialLinks.tsx 

## 2025-05-23 00:44:58
- Modified the Settings component to maintain consistent position and appearance regardless of language direction changes.
- Removed dir attributes from Settings component elements to prevent UI shifts when switching languages.
Components affected: Settings.tsx 

## 2025-05-23 00:50:34
- Fixed Settings button positioning to always stay on the right side of the screen in both LTR and RTL modes
- Added explicit dir="ltr" attribute and CSS positioning to override automatic RTL adjustments
Components affected: Settings.tsx 

## 2025-05-23 00:55:17
- Improved Settings component UI organization and aesthetics
- Reorganized settings into logical groups with better visual separation
- Enhanced UI consistency with improved spacing, colors, and visual hierarchy
- Added shadow effects and better visual feedback for active elements
- Components affected: Settings.tsx

## 2025-05-23 00:59:05
- Added missing translation keys in i18n files for Settings component
- Added "calendarConfig" and "appearance" section titles to both English and Persian translation files
- Fixed issue where translation keys were displayed instead of translated text
- Components affected: translation.json files for both en and fa locales

## 2025-05-23 01:03:32
- Modified Settings component to open in the center of the screen as a modal
- Changed Settings panel background to solid color instead of transparent
- Added a close button to the Settings modal for better usability
- Added overlay background for better focus on the Settings panel
- Components affected: Settings.tsx

## 2025-05-23 01:44:56
- Fixed Settings modal to properly close when clicking outside the dialog
- Modified modal overlay click handling to improve user experience
- Components affected: Settings.tsx

## 2025-05-23 01:46:50
- Applied ThemeProvider to SocialLinks component
- Modified SocialLinks.tsx to use theme settings (textColor and backgroundColor) from ThemeProvider
- Removed hardcoded color values and replaced with dynamic theming
- Components affected: SocialLinks.tsx

## 2025-05-23 01:57:41
- Updated color and emoji selectors in TasksAndNotes component to match the style of task type selector
- Modified selectors to display both the visual element (color/emoji) and text labels
- Standardized selector width and appearance for better UI consistency
- Improved readability by showing descriptive text alongside visual elements
- Components affected: src/components/TasksAndNotes.tsx

## 2025-05-23 02:32:29
- Integrated Stagewise toolbar for AI-powered editing capabilities in development mode
- Added @stagewise/toolbar-react as a development dependency
- Implemented toolbar in a separate React root to avoid interfering with the main application
- Configured toolbar to only initialize in development environment using import.meta.env.DEV check
- Components affected: src/main.tsx