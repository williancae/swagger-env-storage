# Swagger Environment Variables Extension

<!-- AUTO-MANAGED: project-description -->
## Project Overview

Browser extension (Chrome/Edge/Firefox) for managing and auto-replacing environment variables in web forms, with special focus on Swagger UI. Detects `{{variable}}` pattern and replaces with stored values in real-time.

**Technical Stack:**
- Manifest V3 (Chrome standard since 2024)
- TypeScript (strict mode, ES2020 target)
- Native Web Components (no framework overhead)
- Vite (bundler + HMR)
- Tailwind CSS (utility-first styling)
- chrome.storage.local (persistence layer)
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: build-commands -->
## Build Commands

```bash
# Development
npm run dev              # Watch mode with Vite (development build)
npm run web-ext:run      # Run extension in Firefox with auto-reload

# Production
npm run build            # Production build to dist/

# Testing
npm test                 # Run unit tests (Vitest)
npm run test:watch       # Unit tests in watch mode
npm run test:e2e         # E2E tests with Playwright

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Format with Prettier
npm run type-check       # TypeScript validation (no emit)
```
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: architecture -->
## Architecture

```
src/
├── background/
│   └── service-worker.ts      # Extension lifecycle, storage sync
├── content/
│   ├── content-script.ts      # DOM injection entry point
│   ├── autocomplete/          # Autocomplete UI system
│   │   ├── autocomplete.ts    # Dropdown UI for {{ trigger
│   │   └── input-tracker.ts   # Caret position tracking
│   ├── detectors/             # Field detection strategies
│   │   ├── input-detector.ts  # Standard inputs/textareas
│   │   ├── swagger-detector.ts
│   │   └── editor-detector.ts # CodeMirror/Monaco/ACE
│   ├── replacers/             # Replacement implementations
│   │   ├── text-replacer.ts
│   │   ├── codemirror-replacer.ts
│   │   └── monaco-replacer.ts
│   └── observers/
│       └── dom-observer.ts    # MutationObserver for dynamic DOM
├── popup/
│   ├── popup.html
│   ├── popup.ts               # Quick access UI
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
    └── utils.ts               # Helper functions
```

**Component Responsibilities:**
- **Service Worker**: Event-driven lifecycle orchestrator (install/update handlers, 4-item context menu with separator, 3 keyboard shortcuts, message routing with 10+ message types, pending selection storage with 30s timeout)
- **Content Script**: DOM manipulation (DOMObserver with 300ms debounce), variable detection/replacement, autocomplete UI integration, blur/input event delegation, selection capture for popup pre-fill, visual feedback notifications
- **Autocomplete**: Dropdown UI triggered by {{ pattern, keyboard navigation (ArrowDown/Up/Enter/Escape), case-insensitive filtering, position: fixed at viewport coordinates (z-index 10000)
- **Detectors**: Editor detection strategies (CodeMirror, Monaco, ACE) with instance access
- **Popup**: Quick access UI with Web Components (variable list, toggle)
- **Options Page**: Full CRUD interface with Web Components (manager, form, import/export, settings)
- **Shared**: Type-safe abstractions over Chrome Extension APIs
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: conventions -->
## Conventions

**Import Paths:**
- Use `@/` alias for `src/` (configured in tsconfig.json)
- Example: `import { StorageService } from '@/shared/storage'`

**Naming:**
- Files: kebab-case (`service-worker.ts`, `input-detector.ts`)
- Classes: PascalCase with Singleton pattern (`StorageService.getInstance()`)
- Functions: camelCase, exported named functions
- Types/Interfaces: PascalCase, prefixed with type keyword

**Code Standards:**
- Strict TypeScript (`strict: true`, target ES2020)
- ESLint config: `.eslintrc.cjs` (CommonJS module format)
  - extends: eslint:recommended, plugin:@typescript-eslint/recommended
  - parser: @typescript-eslint/parser (ecmaVersion 2020, sourceType module)
  - env: browser, webextensions, es2020
  - rules:
    - no-console: off (debugging allowed)
    - @typescript-eslint/no-unused-vars: error with argsIgnorePattern `^_`
    - @typescript-eslint/no-explicit-any: warn (discouraged but not blocked)
- Prettier config: `.prettierrc` (JSON format)
  - singleQuote: true, semi: true, trailingComma: es5
  - printWidth: 100, tabWidth: 2, useTabs: false
- PostCSS config: `postcss.config.js` (ES module with export default)
  - plugins: tailwindcss, autoprefixer
- Type safety: Chrome types (`@types/chrome`), Vite client types included

**Internationalization:**
- i18n directory: `public/_locales/en/messages.json` (Chrome extension standard)
- Currently English-only with `extName` and `extDescription` keys
- Format: `{ "key": { "message": "value" } }`
- Access via: `chrome.i18n.getMessage('key')`

**Assets:**
- Icons: SVG source at `public/icons/icon.svg`
- Build generates PNG variants (16x16, 48x48, 128x128) from SVG
- Icon references in manifest.json for action, extension icons

**Error Handling:**
- Custom error class: `StorageError` with error codes for storage operations
- Async functions use try-catch or `.catch()` for chrome API calls
- Silent failures for tabs without content script (expected in service worker)
- Promise rejection handling in message listeners with error responses
- Validation errors throw with descriptive messages (key format, length limits)
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: patterns -->
## Patterns

**Service Worker Lifecycle:**
```typescript
// Extension installation and updates
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await storage.initialize();       // Create default storage
    await setupContextMenu();         // Create right-click menu items
    await initializeAnalytics();      // Initialize analytics cache
  }
  if (details.reason === 'update') {
    console.log('Updated to version:', chrome.runtime.getManifest().version);
    await setupContextMenu();
  }
});

// Extension startup (browser launch)
chrome.runtime.onStartup.addListener(async () => {
  await loadCachedData();    // Pre-load variables into memory
  await setupContextMenu();
});
```

**Context Menu Integration:**
```typescript
// Right-click menu items (4 items total)
chrome.contextMenus.create({
  id: 'replace-variables',
  title: 'Substituir variáveis nesta página',
  contexts: ['page', 'editable']
});

chrome.contextMenus.create({
  id: 'add-variable',
  title: 'Nova variável',
  contexts: ['selection']  // Shows when text is selected
});

chrome.contextMenus.create({
  id: 'separator-1',
  type: 'separator',
  contexts: ['page']
});

chrome.contextMenus.create({
  id: 'open-settings',
  title: 'Configurações',
  contexts: ['page']
});

// Click handler routes menu actions and stores selections
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'replace-variables':
      await chrome.tabs.sendMessage(tab.id, { type: 'FORCE_REPLACE' });
      break;
    case 'add-variable':
      if (info.selectionText?.trim()) {
        storePendingSelection(tab.id, info.selectionText.trim());
      }
      await chrome.action.openPopup();
      break;
    case 'open-settings':
      await chrome.runtime.openOptionsPage();
      break;
  }
});
```

**Keyboard Shortcuts:**
```typescript
// Defined in manifest.json, handled in service worker
// - Ctrl+Shift+E (Cmd+Shift+E on Mac): Open popup (with selection capture)
// - Ctrl+Shift+R (Cmd+Shift+R on Mac): Replace variables
// - Ctrl+Shift+X (Cmd+Shift+X on Mac): Toggle extension

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  switch (command) {
    case 'open-popup':
      // Query active tab for selected text
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' });
        if (response?.selection?.trim()) {
          storePendingSelection(tab.id, response.selection.trim());
        }
      } catch (error) {
        // Tab without content script (e.g. chrome://, internal pages)
      }
      await chrome.action.openPopup();
      break;
    case 'replace-variables':
      await chrome.tabs.sendMessage(tab.id, { type: 'FORCE_REPLACE' });
      break;
    case 'toggle-extension':
      await toggleExtension();
      break;
  }
});
```

**Singleton Services:**
```typescript
export class StorageService {
  private static instance: StorageService;
  private cache: StorageData | null = null;
  private cacheTimestamp = 0;

  private constructor() {} // Private constructor prevents direct instantiation

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
}
```

**TypeScript Interfaces:**
```typescript
// Core data structures in @/shared/types.ts
interface Variable {
  id: string;           // UUID via crypto.randomUUID()
  key: string;          // Validated against /^[a-zA-Z0-9_]+$/
  value: string;
  description?: string;
  enabled: boolean;
  createdAt: string;    // ISO timestamp
  updatedAt: string;
}

interface Settings {
  enabled: boolean;
  caseSensitive: boolean;
  replacementTrigger: 'onblur' | 'manual' | 'onsubmit';
  shortcutKey: string;
  theme: ThemeMode;  // 'light' | 'dark' | 'system'
}

interface StorageData {
  version: string;
  variables: Variable[];
  settings: Settings;
}
```

**Variable Pattern Detection:**
- Pattern regex: `/\{\{([a-zA-Z0-9_]+)\}\}/g` (defined in `@/shared/constants.ts`)
- Key validation: `/^[a-zA-Z0-9_]+$/` (alphanumeric and underscore only)
- Max lengths: 50 chars (key), 10000 chars (value)
- Replacement function: `replaceVariables()` in `@/shared/utils.ts`

**Storage Abstraction:**
- Singleton `StorageService.getInstance()` wraps chrome.storage.local
- Data structure: `StorageData` interface with `{ version, variables[], settings }`
- 5-second cache TTL for performance optimization
- Change broadcasting via chrome.storage.onChanged from service worker to all tabs
- Validation and error handling via `StorageError` class

**Message Passing:**
- Service worker message handler: `chrome.runtime.onMessage.addListener()`
  - Returns `true` to keep channel open for async responses
  - Wraps async `handleMessage()` with `.then(sendResponse).catch()`
- Message types handled in service worker switch statement:
  - Storage ops: `GET_VARIABLES`, `ADD_VARIABLE`, `UPDATE_VARIABLE`, `DELETE_VARIABLE`
  - Settings: `GET_SETTINGS`, `UPDATE_SETTINGS`
  - Analytics: `VARIABLE_USED`, `GET_ANALYTICS`, `VARIABLES_DETECTED` (updates badge)
  - Data transfer: `EXPORT_DATA`, `IMPORT_DATA`
  - Content script: `FORCE_REPLACE` (trigger replacement), `GET_SELECTION` (capture selected text)
  - Selection management: `GET_PENDING_SELECTION` (retrieve stored selection for popup pre-fill)
- Storage change broadcasting: chrome.storage.onChanged listener notifies all tabs
- Analytics tracking: In-memory cache (Map) for usage stats (count, lastUsed, urls)
- Selection storage: In-memory Map (tab-specific) with 30s auto-cleanup timeout
- Error handling: try-catch blocks, error responses with descriptive messages, silent failures for tabs without content script

**Replacement Strategy:**
- Default trigger: `onblur` event (configurable in settings)
- Manual triggers:
  - `Ctrl+Shift+R` (Cmd+Shift+R on Mac): Force replace all variables
  - `Ctrl+Shift+E` (Cmd+Shift+E on Mac): Open popup for quick access
- Alternative triggers: `manual`, `onsubmit` (via Settings.replacementTrigger)
- Cache variables in content script for performance
- Debounced event handlers via `debounce()` utility function
- Event delegation pattern for DOM listeners (blur, input events)

**Detector Functions:**
- `detectInputFields(root)`: Finds standard inputs, textareas, contenteditable elements
  - Excludes: password, hidden, file input types
  - Returns: HTMLElement[] matching querySelectorAll criteria
- `hasVariables(element)`: Tests if element contains `{{variable}}` pattern
- `extractVariableNames(element)`: Returns array of variable keys found in element
- `detectAllEditors(root)`: Combines all editor detection functions
  - Returns: `{ codeMirror: CodeMirrorInstance[], monaco: MonacoInstance[], ace: any[] }`
- `detectCodeMirrorEditors(root)`: Detects CodeMirror instances via `.CodeMirror` class
  - Returns: `CodeMirrorInstance[]` with element, instance, optional textarea
  - Access instance: `(element as any).CodeMirror` or fallback to textarea
- `detectMonacoEditors(root)`: Detects Monaco instances via `.monaco-editor` class
  - Returns: `MonacoInstance[]` with element and instance
  - Access via: `window.monaco?.editor?.getEditors()?.find(e => e.getDomNode() === element)`
- `detectAceEditors(root)`: Detects ACE editor instances via `.ace_editor` class
  - Returns: array with element and instance via `window.ace?.edit(element)`

**Replacer Functions:**
- `replaceInTextField(element, variables)`: Replaces in HTMLInputElement/HTMLTextAreaElement
  - Uses `replaceVariables()` from utils
  - Dispatches 'input' event with `bubbles: true` for framework reactivity
  - Logs replacement action to console
- `replaceInCodeMirror(editor, variables)`: CodeMirror replacement (TODO: implementation pending)

**Observer Pattern:**
- `DOMObserver` class: MutationObserver wrapper for dynamic DOM changes
  - Constructor: accepts `onNodesAdded(nodes: Element[])` callback and debounce delay
  - `start()`: Begins observing with debounced handler (300ms in content script)
  - `stop()`: Disconnects observer and cleans up
  - Config: `{ childList: true, subtree: true }` on document.body

**Autocomplete System:**
```typescript
// Trigger: User types {{ in input field
class Autocomplete {
  private dropdown: HTMLDivElement; // Positioned with position: fixed
  private selectedIndex = 0;
  private filterText = '';

  show(input, cursorX, cursorY): void; // Position dropdown at cursor viewport coordinates
  hide(): void;
  updateFilter(text): void;          // Filter variables as user types

  // Keyboard navigation
  // - ArrowDown/ArrowUp: Navigate items
  // - Enter: Insert selected variable
  // - Escape: Close dropdown
}
```
- Dropdown styling: fixed position (viewport coordinates), white bg (#fff), rounded corners (8px), shadow (0 4px 20px rgba(0,0,0,0.12)), max-height 240px, z-index 10000, min-width 220px, max-width 320px
- Border: 1px solid #e2e8f0 with additional box-shadow (0 0 0 1px rgba(0,0,0,0.04)) for depth
- Filter logic: Case-insensitive includes on variable key
- Selection highlight: Light blue background (#eff6ff) with dark blue text (#1e40af) for selected item, smooth transition (0.1s ease)
- Click handlers: Insert variable on item click, mouseenter updates selection
- Item styling: 8px vertical padding, 12px horizontal padding, border-bottom separator (#f1f5f9, last-child has none)
- Font: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto), 13px size, 11px for descriptions (#64748b)
- Empty state: Centered text (#94a3b8) with 12px padding when no matches
- Position adjustment: Prevents overflow bottom/right of viewport
- ARIA attributes: role="listbox", aria-label="Variáveis de ambiente"

**Input Tracking:**
```typescript
// Functions in @/content/autocomplete/input-tracker.ts
detectAutocompletePattern(element): boolean;  // Returns true if last 2 chars are {{
getAutocompleteFilter(element): string;       // Gets text between {{ and cursor
getCaretPosition(element): CaretPosition | null; // Returns { x, y, element }
```
- `CaretPosition`: Viewport pixel coordinates for fixed-position dropdown (x, y, element)
- Single-line inputs: Position below input (rect.bottom for y, rect.left for x using getBoundingClientRect)
- Textareas: Mirror element technique to measure exact cursor position
  - Create invisible mirror div with copied textarea styles
  - Insert text before cursor + temporary span with '|'
  - Measure span.getBoundingClientRect() for exact cursor viewport position
  - Remove mirror after measurement
- Mirror element: Copies all relevant textarea styles (font, padding, line-height, etc.), measures text before cursor, returns spanRect.left and spanRect.bottom as viewport coordinates

**Utility Functions:**
- `generateId()`: UUID generation via crypto.randomUUID()
- `getCurrentTimestamp()`: ISO timestamp strings
- `replaceVariables(text, variables)`: Core replacement logic using VARIABLE_PATTERN
- `validateVariableKey(key)`: Key validation against allowed characters
- `debounce(func, wait)`: Event handler debouncing for performance (returns debounced wrapper)
<!-- END AUTO-MANAGED -->

<!-- MANUAL -->
## Key Design Decisions

### Why Manifest V3?
- Chrome made V3 mandatory in 2024, V2 deprecated
- Better security isolation, event-driven service workers
- Longevity and future compatibility

### Why Native Web Components?
- Small bundle size (< 500KB target)
- No framework overhead
- Type safety with TypeScript

### Storage Strategy
- chrome.storage.local for capacity and availability
- Event-driven sync via chrome.storage.onChanged
- Cache in content script for performance

### Replacement Timing
- On-blur trigger (less intrusive, more predictable)
- Manual trigger via keyboard shortcut (Ctrl+Shift+E)
- Auto-replace toggle available

## Performance Requirements

- Content script overhead: < 50ms
- Total bundle size: < 500KB uncompressed
- Popup load time: < 2 seconds

## Security Considerations

- Input sanitization and pattern validation
- No telemetry or external network requests with sensitive data
- Local-only storage

## Browser Compatibility

- Chrome/Edge: Full support (Manifest V3 standard)
- Firefox: Experimental support (core features functional)

## Development Standards

- Language: TypeScript for type safety
- Testing: Automated tests required
- Documentation: Technical design docs in `claudedocs/`
- Code Organization: Modular architecture, separation of concerns
<!-- END MANUAL -->
