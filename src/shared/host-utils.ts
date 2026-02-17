/**
 * Host matching and filtering utilities for variable segregation by host
 */

import type { Variable } from './types';
import { HOST_PATTERN_REGEX } from './constants';

/**
 * Matches a host pattern against a hostname and optional port.
 *
 * Supported patterns:
 * - Exact match: "api.example.com"
 * - Wildcard: "*" (matches any host)
 * - With port: "api.example.com:8080"
 * - Wildcard port: "api.example.com:*"
 *
 * @param pattern - Host pattern to match (e.g., "api.example.com:8080", "*")
 * @param hostname - Actual hostname to match against
 * @param port - Optional port number or string
 * @returns true if the pattern matches the hostname:port combination
 */
export function matchHost(pattern: string, hostname: string, port?: string | number): boolean {
  if (!pattern || !hostname) return false;

  // Wildcard matches everything
  if (pattern === '*') return true;

  const patternParts = parseHostPattern(pattern);
  if (!patternParts) return false;

  const { host: patternHost, port: patternPort } = patternParts;

  // Match hostname (case-insensitive)
  const hostnameMatch = patternHost === '*' || patternHost.toLowerCase() === hostname.toLowerCase();
  if (!hostnameMatch) return false;

  // If pattern has no port, match regardless of actual port
  if (!patternPort) return true;

  // If pattern port is wildcard, match any port
  if (patternPort === '*') return true;

  // Match specific port
  const actualPort = port ? String(port) : '';
  return patternPort === actualPort;
}

/**
 * Filters variables that apply to a specific host.
 * Returns variables that are either global (empty hosts array) or match the given host.
 *
 * @param variables - All available variables
 * @param hostname - Current page hostname
 * @param port - Current page port (optional)
 * @returns Variables applicable to this host
 */
export function filterVariablesByHost(
  variables: Variable[],
  hostname: string,
  port?: string | number
): Variable[] {
  return variables.filter((variable) => {
    // Global variables (no hosts defined) apply everywhere
    if (isGlobalVariable(variable)) return true;

    // Check if any host pattern matches
    return variable.hosts.some((pattern) => matchHost(pattern, hostname, port));
  });
}

/**
 * Checks if a variable is global (applies to all hosts).
 * A variable is global when its hosts array is empty or undefined.
 */
export function isGlobalVariable(variable: Variable): boolean {
  return !variable.hosts || variable.hosts.length === 0;
}

/**
 * Validates a host pattern string.
 *
 * @param pattern - Host pattern to validate
 * @returns Error message string if invalid, null if valid
 */
export function validateHostPattern(pattern: string): string | null {
  if (!pattern || pattern.trim().length === 0) {
    return 'Padrão de host não pode ser vazio';
  }

  const trimmed = pattern.trim();

  // Wildcard is always valid
  if (trimmed === '*') return null;

  // Check max length
  if (trimmed.length > 253) {
    return 'Padrão de host deve ter no máximo 253 caracteres';
  }

  // Validate against regex
  if (!HOST_PATTERN_REGEX.test(trimmed)) {
    return 'Padrão de host inválido. Use formato: hostname, hostname:porta, ou *';
  }

  // Validate port range if present
  const portMatch = trimmed.match(/:(\d+)$/);
  if (portMatch) {
    const port = parseInt(portMatch[1], 10);
    if (port < 1 || port > 65535) {
      return 'Porta deve estar entre 1 e 65535';
    }
  }

  return null;
}

/**
 * Formats a hostname and port for display.
 *
 * @param hostname - Hostname to display
 * @param port - Optional port
 * @returns Formatted string like "hostname:port" or just "hostname"
 */
export function formatHostDisplay(hostname: string, port?: string | number): string {
  if (!hostname) return '';
  if (!port || port === '' || port === '0') return hostname;
  return `${hostname}:${port}`;
}

/**
 * Parses a host pattern into hostname and port parts.
 * @internal
 */
function parseHostPattern(pattern: string): { host: string; port?: string } | null {
  if (!pattern) return null;

  const trimmed = pattern.trim();
  if (trimmed === '*') return { host: '*' };

  // Find the last colon to split host:port
  const lastColonIndex = trimmed.lastIndexOf(':');

  if (lastColonIndex === -1) {
    return { host: trimmed };
  }

  const host = trimmed.substring(0, lastColonIndex);
  const port = trimmed.substring(lastColonIndex + 1);

  if (!host) return null;

  return { host, port: port || undefined };
}
