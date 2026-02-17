# Architecture Documentation

## Project Structure

```text
src/
├── background/
│   └── service-worker.ts      # Extension lifecycle, storage sync
├── content/
│   ├── content-script.ts      # DOM injection entry point
│   ├── autocomplete/          # Autocomplete UI system
│   │   ├── autocomplete.ts    # Dropdown UI for {{ trigger
│   │   └── input-tracker.ts   # Caret position tracking
│   ├── adapters/              # Editor adapter pattern
│   │   ├── editor-adapter.ts  # Base interface for editor adapters
│   │   ├── codemirror-adapter.ts
│   │   ├── monaco-adapter.ts
│   │   └── ace-adapter.ts
│   ├── detectors/             # Field detection strategies
│   │   ├── input-detector.ts  # Standard inputs/textareas
│   │   ├── swagger-detector.ts
│   │   └── editor-detector.ts # CodeMirror/Monaco/ACE
│   ├── replacers/             # Replacement implementations
│   │   ├── text-replacer.ts
│   │   ├── codemirror-replacer.ts
│   │   └── monaco-replacer.ts
│   ├── ui/
│   │   └── visual-feedback.ts # User notifications
│   └── observers/
│       └── dom-observer.ts    # MutationObserver for dynamic DOM
├── popup/
│   ├── popup.html
│   ├── popup.ts               # Quick access UI with inline editing
│   └── components/            # Web Components
│       ├── variable-list.ts
│       └── quick-toggle.ts
├── options/
│   ├── options.html
│   ├── options.ts             # Full CRUD management
│   └── components/
│       ├── variable-manager.ts
│       ├── variable-form.ts
│       ├── import-export.ts
│       └── settings-panel.ts
└── shared/
    ├── types.ts               # TypeScript interfaces
    ├── constants.ts           # Regex patterns, config
    ├── storage.ts             # chrome.storage.local wrapper
    ├── messaging.ts           # Inter-component communication
    ├── host-utils.ts          # Host pattern matching and filtering
    ├── migration.ts           # Data migration utilities
    └── utils.ts               # Helper functions
```

## Component Responsibilities

### Service Worker

Event-driven lifecycle orchestrator:

- Install/update handlers
- 4-item context menu with separator
- 3 keyboard shortcuts with Alt+Shift
- Message routing with 10+ message types
- Pending selection storage with 30s timeout

### Content Script

DOM manipulation layer:

- DOMObserver with 300ms debounce
- Variable detection/replacement
- Autocomplete UI integration
- Blur/input event delegation
- Selection capture for popup pre-fill
- Visual feedback notifications

### Autocomplete System

Smart dropdown UI:

- Triggered by `{{` pattern
- Keyboard navigation (ArrowDown/Up/Enter/Escape)
- Case-insensitive filtering
- Position: fixed at viewport coordinates (z-index 10000)

### Adapters

Editor adapter pattern for:

- CodeMirror
- Monaco
- ACE

Provides unified interface for all editor types.

### Popup

Quick access UI with:

- Inline variable editing
- Host-based filtering
- Selection pre-fill
- Web Components architecture

### Options Page

Full CRUD interface:

- Variable manager
- Import/export
- Settings panel
- Web Components architecture

## Code Standards

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `service-worker.ts`, `input-detector.ts`)
- **Classes**: `PascalCase` with Singleton pattern (`StorageService.getInstance()`)
- **Functions**: `camelCase`, exported named functions
- **Types/Interfaces**: `PascalCase`, prefixed with type keyword
- **Constants**: `UPPER_SNAKE_CASE`

### Import Paths

Use `@/` alias for `src/` imports:

```typescript
import { StorageService } from '@/shared/storage';
```

### TypeScript Configuration

- Strict mode enabled (`strict: true`)
- Target: ES2020
- Chrome types included (`@types/chrome`)
- Vite client types included

### ESLint Configuration

File: `.eslintrc.cjs` (CommonJS module format)

- Extends: `eslint:recommended`, `plugin:@typescript-eslint/recommended`
- Parser: `@typescript-eslint/parser` (ecmaVersion 2020, sourceType module)
- Environment: `browser`, `webextensions`, `es2020`
- Rules:
  - `no-console`: off (debugging allowed)
  - `@typescript-eslint/no-unused-vars`: error with `argsIgnorePattern: ^_`
  - `@typescript-eslint/no-explicit-any`: warn (discouraged but not blocked)

### Prettier Configuration

File: `.prettierrc` (JSON format)

- `singleQuote`: true
- `semi`: true
- `trailingComma`: es5
- `printWidth`: 100
- `tabWidth`: 2
- `useTabs`: false

### PostCSS Configuration

File: `postcss.config.js` (ES module with export default)

- Plugins: `tailwindcss`, `autoprefixer`

## Performance Metrics

Target metrics for optimal user experience:

- **Content script load**: < 50ms
- **Replacement latency**: < 20ms
- **Total bundle size**: ~72KB (target: < 500KB)
- **Popup load time**: < 2 seconds

## Tech Stack

| Technology          | Purpose                                  |
| ------------------- | ---------------------------------------- |
| **TypeScript**      | Type-safe development with strict mode   |
| **Vite**            | Fast bundling with HMR support           |
| **Tailwind CSS**    | Utility-first styling                    |
| **Web Components**  | Native, framework-free UI components     |
| **Manifest V3**     | Modern Chrome extension standard         |
| **Vitest**          | Unit testing framework                   |
| **Playwright**      | End-to-end testing                       |

## Design Decisions

### Why Manifest V3?

- Chrome made V3 mandatory in 2024, V2 deprecated
- Better security isolation, event-driven service workers
- Longevity and future compatibility

### Why Native Web Components?

- Small bundle size (< 500KB target)
- No framework overhead
- Type safety with TypeScript

### Storage Strategy

- `chrome.storage.local` for capacity and availability
- Event-driven sync via `chrome.storage.onChanged`
- Cache in content script for performance

### Replacement Timing

- On-blur trigger (less intrusive, more predictable)
- Manual trigger via keyboard shortcuts
- Auto-replace toggle available

## Browser Compatibility

- **Chrome/Edge**: Full support (Manifest V3 standard)
- **Firefox**: Experimental support (core features functional)
