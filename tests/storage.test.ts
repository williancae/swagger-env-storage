/**
 * Unit tests for StorageService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, StorageError } from '../src/shared/storage';
import type { Variable } from '../src/shared/types';

// Mock chrome.storage API
const mockStorage: Record<string, any> = {};
const mockListeners: Array<(changes: any, areaName: string) => void> = [];

global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        if (keys === null) {
          return Promise.resolve(mockStorage);
        }
        const result: Record<string, any> = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (key in mockStorage) {
              result[key] = mockStorage[key];
            }
          });
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((items) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      getBytesInUse: vi.fn(() => Promise.resolve(1024)),
      QUOTA_BYTES: 10485760, // 10MB
    },
    onChanged: {
      addListener: vi.fn((callback) => {
        mockListeners.push(callback);
      }),
    },
  },
} as any;

describe('StorageService', () => {
  let storage: StorageService;

  beforeEach(async () => {
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    mockListeners.length = 0;

    storage = StorageService.getInstance();
    await storage.initialize();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância', () => {
      const instance1 = StorageService.getInstance();
      const instance2 = StorageService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('deve inicializar com dados padrão', async () => {
      const data = await storage.getData();
      expect(data.version).toBe('1.0.0');
      expect(data.variables).toEqual([]);
      expect(data.settings).toBeDefined();
    });
  });

  describe('Variable CRUD', () => {
    it('deve criar uma nova variável', async () => {
      const variable = await storage.saveVariable({
        key: 'API_URL',
        value: 'https://api.example.com',
        description: 'Base API URL',
      });

      expect(variable).toBeDefined();
      expect(variable.id).toBeDefined();
      expect(variable.key).toBe('API_URL');
      expect(variable.value).toBe('https://api.example.com');
      expect(variable.enabled).toBe(true);
      expect(variable.createdAt).toBeDefined();
      expect(variable.updatedAt).toBeDefined();
    });

    it('deve obter todas as variáveis', async () => {
      await storage.saveVariable({ key: 'VAR1', value: 'value1' });
      await storage.saveVariable({ key: 'VAR2', value: 'value2' });

      const variables = await storage.getVariables();
      expect(variables).toHaveLength(2);
    });

    it('deve obter variável por chave', async () => {
      await storage.saveVariable({ key: 'TEST_VAR', value: 'test_value' });

      const variable = await storage.getVariable('TEST_VAR');
      expect(variable).toBeDefined();
      expect(variable?.key).toBe('TEST_VAR');
      expect(variable?.value).toBe('test_value');
    });

    it('deve retornar null para variável inexistente', async () => {
      const variable = await storage.getVariable('NON_EXISTENT');
      expect(variable).toBeNull();
    });

    it('deve atualizar variável existente', async () => {
      const created = await storage.saveVariable({
        key: 'UPDATE_TEST',
        value: 'initial_value',
      });

      const updated = await storage.saveVariable({
        id: created.id,
        key: 'UPDATE_TEST',
        value: 'updated_value',
      });

      expect(updated.value).toBe('updated_value');
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    it('deve deletar variável por chave', async () => {
      await storage.saveVariable({ key: 'DELETE_ME', value: 'value' });

      const deleted = await storage.deleteVariable('DELETE_ME');
      expect(deleted).toBe(true);

      const variable = await storage.getVariable('DELETE_ME');
      expect(variable).toBeNull();
    });

    it('deve retornar false ao deletar variável inexistente', async () => {
      const deleted = await storage.deleteVariable('NON_EXISTENT');
      expect(deleted).toBe(false);
    });
  });

  describe('Validation', () => {
    it('deve rejeitar chave vazia', async () => {
      await expect(
        storage.saveVariable({ key: '', value: 'value' })
      ).rejects.toThrow(StorageError);
    });

    it('deve rejeitar chave com caracteres inválidos', async () => {
      await expect(
        storage.saveVariable({ key: 'INVALID-KEY', value: 'value' })
      ).rejects.toThrow(StorageError);
    });

    it('deve rejeitar chave com espaços', async () => {
      await expect(
        storage.saveVariable({ key: 'INVALID KEY', value: 'value' })
      ).rejects.toThrow(StorageError);
    });

    it('deve aceitar chave com underscore', async () => {
      const variable = await storage.saveVariable({
        key: 'VALID_KEY_123',
        value: 'value',
      });
      expect(variable).toBeDefined();
    });

    it('deve rejeitar chave muito longa', async () => {
      const longKey = 'A'.repeat(51);
      await expect(
        storage.saveVariable({ key: longKey, value: 'value' })
      ).rejects.toThrow(StorageError);
    });

    it('deve rejeitar chave duplicada', async () => {
      await storage.saveVariable({ key: 'DUPLICATE', value: 'value1' });

      await expect(
        storage.saveVariable({ key: 'DUPLICATE', value: 'value2' })
      ).rejects.toThrow(StorageError);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await storage.saveVariable({
        key: 'API_URL',
        value: 'https://api.example.com',
        description: 'Production API',
      });
      await storage.saveVariable({
        key: 'DB_HOST',
        value: 'localhost',
        description: 'Database host',
      });
      await storage.saveVariable({
        key: 'API_KEY',
        value: 'secret123',
        description: 'API authentication key',
      });
    });

    it('deve buscar por chave', async () => {
      const results = await storage.searchVariables('API');
      expect(results).toHaveLength(2);
      expect(results.map(v => v.key)).toContain('API_URL');
      expect(results.map(v => v.key)).toContain('API_KEY');
    });

    it('deve buscar por valor', async () => {
      const results = await storage.searchVariables('localhost');
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('DB_HOST');
    });

    it('deve buscar por descrição', async () => {
      const results = await storage.searchVariables('Database');
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('DB_HOST');
    });

    it('deve retornar todas as variáveis com query vazia', async () => {
      const results = await storage.searchVariables('');
      expect(results).toHaveLength(3);
    });

    it('deve ser case-insensitive', async () => {
      const results = await storage.searchVariables('api');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Import/Export', () => {
    beforeEach(async () => {
      await storage.saveVariable({
        key: 'VAR1',
        value: 'value1',
        description: 'First variable',
      });
      await storage.saveVariable({
        key: 'VAR2',
        value: 'value2',
      });
    });

    it('deve exportar variáveis como JSON', async () => {
      const json = await storage.exportVariables();
      const data = JSON.parse(json);

      expect(data.version).toBeDefined();
      expect(data.exportedAt).toBeDefined();
      expect(data.variables).toHaveLength(2);
    });

    it('deve importar variáveis de JSON (substituir)', async () => {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        variables: [
          {
            key: 'IMPORTED_VAR',
            value: 'imported_value',
            enabled: true,
          },
        ],
      };

      await storage.importVariables(JSON.stringify(exportData), false);

      const variables = await storage.getVariables();
      expect(variables).toHaveLength(1);
      expect(variables[0].key).toBe('IMPORTED_VAR');
    });

    it('deve importar variáveis de JSON (merge)', async () => {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        variables: [
          {
            key: 'IMPORTED_VAR',
            value: 'imported_value',
            enabled: true,
          },
        ],
      };

      await storage.importVariables(JSON.stringify(exportData), true);

      const variables = await storage.getVariables();
      expect(variables).toHaveLength(3);
      expect(variables.map(v => v.key)).toContain('IMPORTED_VAR');
      expect(variables.map(v => v.key)).toContain('VAR1');
    });

    it('deve rejeitar JSON inválido', async () => {
      await expect(
        storage.importVariables('invalid json')
      ).rejects.toThrow(StorageError);
    });

    it('deve rejeitar JSON sem array de variáveis', async () => {
      await expect(
        storage.importVariables(JSON.stringify({ version: '1.0.0' }))
      ).rejects.toThrow(StorageError);
    });

    it('deve validar variáveis importadas', async () => {
      const invalidData = {
        variables: [
          { key: 'INVALID-KEY', value: 'value' },
        ],
      };

      await expect(
        storage.importVariables(JSON.stringify(invalidData))
      ).rejects.toThrow(StorageError);
    });
  });

  describe('Storage Changes Listener', () => {
    it('deve adicionar listener de mudanças', () => {
      const callback = vi.fn();
      storage.onChanged(callback);

      expect(mockListeners).toHaveLength(1);
    });
  });

  describe('Storage Stats', () => {
    it('deve retornar estatísticas de uso', async () => {
      const stats = await storage.getStorageStats();

      expect(stats.bytesInUse).toBeDefined();
      expect(stats.quota).toBe(10485760);
    });
  });

  describe('Clear Variables', () => {
    it('deve limpar todas as variáveis', async () => {
      await storage.saveVariable({ key: 'VAR1', value: 'value1' });
      await storage.saveVariable({ key: 'VAR2', value: 'value2' });

      await storage.clearVariables();

      const variables = await storage.getVariables();
      expect(variables).toHaveLength(0);
    });
  });
});
