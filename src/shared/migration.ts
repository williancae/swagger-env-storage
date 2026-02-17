/**
 * Storage migration system for version upgrades.
 * Handles data schema changes between extension versions.
 */

import type { StorageData, Variable } from './types';
import { STORAGE_VERSION } from './constants';

/**
 * V1 Variable interface (before hosts field)
 */
interface V1Variable {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * V1 StorageData interface
 */
interface V1StorageData {
  version: string;
  variables: V1Variable[];
  settings: StorageData['settings'];
}

/**
 * Runs all necessary migrations to bring data up to current version.
 * Migrations are idempotent and safe to run multiple times.
 *
 * @param currentData - The data currently stored
 * @returns Migrated data at current version
 */
export async function runMigrations(currentData: StorageData): Promise<StorageData> {
  let data = { ...currentData };
  const currentVersion = data.version || '1.0.0';

  // V1 -> V2: Add hosts field to variables
  if (isVersionBefore(currentVersion, '2.0.0')) {
    data = migrateV1toV2(data as unknown as V1StorageData);
  }

  return data;
}

/**
 * Migrates storage data from V1 to V2.
 * Adds `hosts: []` (global) to all existing variables.
 *
 * @param data - V1 format storage data
 * @returns V2 format storage data with hosts field
 */
export function migrateV1toV2(data: V1StorageData): StorageData {
  const migratedVariables: Variable[] = (data.variables || []).map((v) => ({
    ...v,
    hosts: (v as V1Variable & { hosts?: string[] }).hosts ?? [],
  }));

  return {
    ...data,
    version: STORAGE_VERSION,
    variables: migratedVariables,
  };
}

/**
 * Compares two semver version strings.
 * Returns true if `version` is strictly before `target`.
 *
 * @internal
 */
function isVersionBefore(version: string, target: string): boolean {
  const vParts = version.split('.').map(Number);
  const tParts = target.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const v = vParts[i] || 0;
    const t = tParts[i] || 0;
    if (v < t) return true;
    if (v > t) return false;
  }

  return false; // equal versions
}
