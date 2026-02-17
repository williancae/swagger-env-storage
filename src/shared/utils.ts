/**
 * Utility functions
 */

import type { Variable, ThemeMode } from './types';
import { VARIABLE_PATTERN } from './constants';

/** Resolves effective theme: 'system' uses prefers-color-scheme, otherwise 'light' or 'dark' */
export function getEffectiveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/** Applies theme to document: adds/removes 'dark' class on documentElement */
export function applyTheme(theme: ThemeMode): void {
  const effective = getEffectiveTheme(theme);
  if (effective === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function replaceVariables(text: string, variables: Variable[]): string {
  VARIABLE_PATTERN.lastIndex = 0;

  return text.replace(VARIABLE_PATTERN, (match, key) => {
    const variable = variables.find((v) => v.key === key && v.enabled);
    return variable ? variable.value : match;
  });
}

export function validateVariableKey(key: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(key);
}

/** Shortcut label for opening popup: Alt+Shift+E on all platforms */
export function getOpenPopupShortcutLabel(): string {
  return 'Alt+Shift+E';
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
}
