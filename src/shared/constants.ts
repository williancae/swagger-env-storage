/**
 * Constants and regex patterns
 */

export const VARIABLE_PATTERN = /\{\{([a-zA-Z0-9_]+)\}\}/g;

export const MAX_VARIABLE_NAME_LENGTH = 50;
export const MAX_VARIABLE_VALUE_LENGTH = 10000;

export const STORAGE_VERSION = '2.0.0';

// eslint-disable-next-line no-useless-escape
export const HOST_PATTERN_REGEX = /^(\*|[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*)(:(\d{1,5}|\*))?$/;

export const DEFAULT_SETTINGS = {
  enabled: true,
  caseSensitive: false,
  replacementTrigger: 'onblur' as const,
  shortcutKey: 'Alt+Shift+E',
  theme: 'light' as const,
};

export const CACHE_TTL = 5000; // 5 seconds
