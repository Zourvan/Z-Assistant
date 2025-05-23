# CHANGELOG

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