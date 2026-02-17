/**
 * Storage abstraction layer for chrome.storage.local
 * Provides robust CRUD operations, validation, import/export, and search functionality
 */

import type { Variable, Settings, StorageData } from './types';
import {
  STORAGE_VERSION,
  DEFAULT_SETTINGS,
  MAX_VARIABLE_NAME_LENGTH,
  MAX_VARIABLE_VALUE_LENGTH
} from './constants';
import { generateId, getCurrentTimestamp, validateVariableKey } from './utils';
import { validateHostPattern } from './host-utils';
import { runMigrations } from './migration';

/**
 * Error class for storage-related errors
 */
export class StorageError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Singleton service for managing extension storage
 */
export class StorageService {
  private static instance: StorageService;
  private cache: StorageData | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 5000; // 5 seconds

  private constructor() {}

  /**
   * Gets the singleton instance
   */
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Initializes storage with default values if empty
   */
  async initialize(): Promise<void> {
    const data = await this.getData();

    if (!data.version) {
      await this.setData({
        version: STORAGE_VERSION,
        variables: [],
        settings: DEFAULT_SETTINGS,
      });
    }
  }

  /**
   * Gets all data from storage with caching
   */
  async getData(): Promise<StorageData> {
    const now = Date.now();

    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.cache;
    }

    const result = await chrome.storage.local.get(null);
    const rawSettings = (result.settings as Partial<Settings> | undefined) || {};
    const rawVariables = ((result.variables as Variable[]) || []).map((v) => ({
      ...v,
      hosts: v.hosts ?? [],
    }));
    let data: StorageData = {
      version: (result.version as string) || STORAGE_VERSION,
      variables: rawVariables,
      settings: { ...DEFAULT_SETTINGS, ...rawSettings },
    };

    // Run migrations if version is outdated
    if (data.version !== STORAGE_VERSION) {
      data = await runMigrations(data);
      await chrome.storage.local.set(data);
    }

    this.cache = data;
    this.cacheTimestamp = now;

    return data;
  }

  /**
   * Sets all data in storage and invalidates cache
   */
  async setData(data: StorageData): Promise<void> {
    await chrome.storage.local.set(data);
    this.cache = data;
    this.cacheTimestamp = Date.now();
  }

  /**
   * Invalidates the cache
   */
  private invalidateCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Gets all variables
   */
  async getVariables(): Promise<Variable[]> {
    const data = await this.getData();
    return data.variables;
  }

  /**
   * Gets a single variable by key
   * @param key - Variable key to search for
   * @returns Variable if found, null otherwise
   */
  async getVariable(key: string): Promise<Variable | null> {
    const variables = await this.getVariables();
    return variables.find(v => v.key === key) || null;
  }

  /**
   * Validates a variable before saving
   * @throws {StorageError} If validation fails
   */
  private validateVariable(variable: Partial<Variable>): void {
    if (!variable.key || typeof variable.key !== 'string') {
      throw new StorageError('Chave da variável é obrigatória', 'INVALID_KEY');
    }

    if (variable.key.length > MAX_VARIABLE_NAME_LENGTH) {
      throw new StorageError(
        `Nome da variável deve ter no máximo ${MAX_VARIABLE_NAME_LENGTH} caracteres`,
        'KEY_TOO_LONG'
      );
    }

    if (!validateVariableKey(variable.key)) {
      throw new StorageError(
        'Nome da variável deve conter apenas letras, números e underscore',
        'INVALID_KEY_FORMAT'
      );
    }

    if (variable.value && variable.value.length > MAX_VARIABLE_VALUE_LENGTH) {
      throw new StorageError(
        `Valor da variável deve ter no máximo ${MAX_VARIABLE_VALUE_LENGTH} caracteres`,
        'VALUE_TOO_LONG'
      );
    }

    // Validate hosts if provided
    if (variable.hosts && Array.isArray(variable.hosts)) {
      for (const host of variable.hosts) {
        const hostError = validateHostPattern(host);
        if (hostError) {
          throw new StorageError(
            `Host inválido "${host}": ${hostError}`,
            'INVALID_HOST_PATTERN'
          );
        }
      }
    }
  }

  /**
   * Saves a variable (create or update)
   * @throws {StorageError} If validation fails or duplicate key exists
   */
  async saveVariable(variable: Partial<Variable>): Promise<Variable> {
    this.validateVariable(variable);

    const variables = await this.getVariables();
    const now = getCurrentTimestamp();

    let savedVariable: Variable;
    const existingIndex = variables.findIndex(v => v.id === variable.id);

    if (existingIndex !== -1) {
      // Update existing
      savedVariable = {
        ...variables[existingIndex],
        ...variable,
        updatedAt: now,
      } as Variable;
      variables[existingIndex] = savedVariable;
    } else {
      // Check for duplicate key
      const duplicateKey = variables.find(v => v.key === variable.key);
      if (duplicateKey) {
        throw new StorageError(
          `Variável com a chave "${variable.key}" já existe`,
          'DUPLICATE_KEY'
        );
      }

      // Create new
      savedVariable = {
        id: generateId(),
        key: variable.key!,
        value: variable.value || '',
        description: variable.description,
        enabled: variable.enabled !== undefined ? variable.enabled : true,
        hosts: variable.hosts ?? [],
        createdAt: now,
        updatedAt: now,
      };
      variables.push(savedVariable);
    }

    await this.setVariables(variables);
    return savedVariable;
  }

  /**
   * Deletes a variable by key
   * @returns true if deleted, false if not found
   */
  async deleteVariable(key: string): Promise<boolean> {
    const variables = await this.getVariables();
    const initialLength = variables.length;
    const filtered = variables.filter(v => v.key !== key);

    if (filtered.length === initialLength) {
      return false;
    }

    await this.setVariables(filtered);
    return true;
  }

  /**
   * Deletes a variable by ID
   * @returns true if deleted, false if not found
   */
  async deleteVariableById(id: string): Promise<boolean> {
    const variables = await this.getVariables();
    const initialLength = variables.length;
    const filtered = variables.filter(v => v.id !== id);

    if (filtered.length === initialLength) {
      return false;
    }

    await this.setVariables(filtered);
    return true;
  }

  /**
   * Searches variables by query (matches key, value, or description)
   * @param query - Search term (case-insensitive)
   */
  async searchVariables(query: string): Promise<Variable[]> {
    if (!query || query.trim().length === 0) {
      return this.getVariables();
    }

    const variables = await this.getVariables();
    const lowerQuery = query.toLowerCase();

    return variables.filter(v =>
      v.key.toLowerCase().includes(lowerQuery) ||
      v.value.toLowerCase().includes(lowerQuery) ||
      (v.description && v.description.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Exports all variables as JSON string
   */
  async exportVariables(): Promise<string> {
    const variables = await this.getVariables();
    const exportData = {
      version: STORAGE_VERSION,
      exportedAt: getCurrentTimestamp(),
      variables,
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Imports variables from JSON string
   * @param json - JSON string containing variables
   * @param merge - If true, merges with existing variables; if false, replaces all
   * @throws {StorageError} If JSON is invalid or contains invalid variables
   */
  async importVariables(json: string, merge = false): Promise<void> {
    let importData: any;

    try {
      importData = JSON.parse(json);
    } catch (error) {
      throw new StorageError('JSON inválido', 'INVALID_JSON');
    }

    if (!importData.variables || !Array.isArray(importData.variables)) {
      throw new StorageError('JSON não contém array de variáveis válido', 'INVALID_FORMAT');
    }

    // Validate all variables before importing
    const importVariables: Variable[] = [];
    const now = getCurrentTimestamp();

    for (const v of importData.variables) {
      try {
        this.validateVariable(v);
        importVariables.push({
          id: generateId(), // Generate new IDs to avoid conflicts
          key: v.key,
          value: v.value || '',
          description: v.description,
          enabled: v.enabled !== undefined ? v.enabled : true,
          hosts: v.hosts ?? [],
          createdAt: v.createdAt || now,
          updatedAt: now,
        });
      } catch (error) {
        if (error instanceof StorageError) {
          throw new StorageError(
            `Erro na variável "${v.key}": ${error.message}`,
            'INVALID_VARIABLE'
          );
        }
        throw error;
      }
    }

    if (merge) {
      const existingVariables = await this.getVariables();
      const mergedVariables = [...existingVariables];

      for (const importVar of importVariables) {
        const existingIndex = mergedVariables.findIndex(v => v.key === importVar.key);
        if (existingIndex !== -1) {
          mergedVariables[existingIndex] = importVar;
        } else {
          mergedVariables.push(importVar);
        }
      }

      await this.setVariables(mergedVariables);
    } else {
      await this.setVariables(importVariables);
    }
  }

  /**
   * Clears all variables
   */
  async clearVariables(): Promise<void> {
    await this.setVariables([]);
  }

  /**
   * Sets all variables and invalidates cache
   */
  async setVariables(variables: Variable[]): Promise<void> {
    const data = await this.getData();
    data.variables = variables;
    await this.setData(data);
  }

  /**
   * Gets current settings
   */
  async getSettings(): Promise<Settings> {
    const data = await this.getData();
    return data.settings;
  }

  /**
   * Updates settings
   */
  async setSettings(settings: Settings): Promise<void> {
    const data = await this.getData();
    data.settings = settings;
    await this.setData(data);
  }

  /**
   * Adds a listener for storage changes
   * @param callback - Function to call when storage changes
   */
  onChanged(callback: (changes: Record<string, chrome.storage.StorageChange>) => void): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        this.invalidateCache();
        callback(changes);
      }
    });
  }

  /**
   * Gets storage usage statistics
   */
  async getStorageStats(): Promise<{ bytesInUse: number; quota: number }> {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const quota = chrome.storage.local.QUOTA_BYTES;
    return { bytesInUse, quota };
  }
}
