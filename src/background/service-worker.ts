/**
 * Service Worker - Background script
 * Handles extension lifecycle, storage events, and inter-component communication
 */

import { StorageService } from '@/shared/storage';
import type { Variable } from '@/shared/types';
import { runMigrations } from '@/shared/migration';

const storage = StorageService.getInstance();

// Cache para analytics e otimização
interface AnalyticsData {
  usageCount: number;
  lastUsed: string | null;
  urls: string[];
}

interface PendingSelection {
  text: string;
  timestamp: number;
}

const analyticsCache = new Map<string, AnalyticsData>();
let variablesCache: Variable[] = [];

// In-memory storage for pending selections (tab-specific)
const pendingSelections = new Map<number, PendingSelection>();

// Auto-cleanup timeout (30 seconds)
const SELECTION_TIMEOUT_MS = 30000;

/**
 * Store pending selection for tab
 */
function storePendingSelection(tabId: number, text: string): void {
  const selection: PendingSelection = {
    text,
    timestamp: Date.now(),
  };

  pendingSelections.set(tabId, selection);

  // Auto-cleanup after timeout
  setTimeout(() => {
    const stored = pendingSelections.get(tabId);
    if (stored && stored.timestamp === selection.timestamp) {
      pendingSelections.delete(tabId);
      console.log('[Service Worker] Pending selection auto-cleared for tab:', tabId);
    }
  }, SELECTION_TIMEOUT_MS);

  console.log('[Service Worker] Pending selection stored for tab:', tabId);
}

/**
 * Get and clear pending selection for tab
 */
function getPendingSelection(tabId: number): { selection: string | null } {
  const stored = pendingSelections.get(tabId);

  if (!stored) {
    return { selection: null };
  }

  // Clear after consumption
  pendingSelections.delete(tabId);
  console.log('[Service Worker] Pending selection consumed for tab:', tabId);

  return { selection: stored.text };
}

/**
 * Extension installation handler
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[Service Worker] Extensão instalada, inicializando storage...');
    await storage.initialize();
    await setupContextMenu();
    await initializeAnalytics();
  }

  if (details.reason === 'update') {
    console.log(
      '[Service Worker] Extensão atualizada para versão:',
      chrome.runtime.getManifest().version
    );
    const currentData = await storage.getData();
    const migratedData = await runMigrations(currentData);
    await storage.setData(migratedData);
    console.log('[Service Worker] Migrations executadas, versão:', migratedData.version);
    await setupContextMenu();
  }
});

/**
 * Extension startup handler
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Service Worker] Extensão iniciada');
  await loadCachedData();
  await setupContextMenu();
});

/**
 * Setup context menu (botão direito)
 */
async function setupContextMenu(): Promise<void> {
  try {
    await chrome.contextMenus.removeAll();

    chrome.contextMenus.create({
      id: 'replace-variables',
      title: 'Substituir variáveis nesta página',
      contexts: ['page', 'editable'],
    });

    chrome.contextMenus.create({
      id: 'add-variable',
      title: 'Nova variável',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'separator-1',
      type: 'separator',
      contexts: ['page'],
    });

    chrome.contextMenus.create({
      id: 'open-settings',
      title: 'Configurações',
      contexts: ['page'],
    });

    console.log('[Service Worker] Context menu configurado');
  } catch (error) {
    console.error('[Service Worker] Erro ao configurar context menu:', error);
  }
}

/**
 * Context menu click handler
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  try {
    switch (info.menuItemId) {
      case 'replace-variables':
        await chrome.tabs.sendMessage(tab.id, {
          type: 'FORCE_REPLACE',
        });
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
  } catch (error) {
    console.error('[Service Worker] Erro ao processar click do context menu:', error);
  }
});

/**
 * Keyboard shortcuts handler
 */
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    switch (command) {
      // _execute_action is now used for opening popup (doesn't fire onCommand)
      // Selection capture moved to popup initialization

      case 'replace-variables':
        await chrome.tabs.sendMessage(tab.id, {
          type: 'FORCE_REPLACE',
        });
        break;

      case 'toggle-extension':
        await toggleExtension();
        break;
    }
  } catch (error) {
    console.error('[Service Worker] Erro ao executar comando:', error);
  }
});

/**
 * Toggle extension enabled/disabled
 */
async function toggleExtension(): Promise<void> {
  try {
    const settings = await storage.getSettings();
    settings.enabled = !settings.enabled;
    await storage.setSettings(settings);

    console.log('[Service Worker] Extensão', settings.enabled ? 'ativada' : 'desativada');
  } catch (error) {
    console.error('[Service Worker] Erro ao alternar estado da extensão:', error);
  }
}

/**
 * Message passing handler
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('[Service Worker] Erro ao processar mensagem:', error);
      sendResponse({ error: error.message });
    });

  return true; // Mantém canal aberto para resposta assíncrona
});

/**
 * Handle messages from popup, content scripts, and other components
 */
async function handleMessage(message: any, sender: chrome.runtime.MessageSender): Promise<any> {
  const { type, payload } = message;

  switch (type) {
    // Get all variables
    case 'GET_VARIABLES':
      return await storage.getVariables();

    // Add new variable
    case 'ADD_VARIABLE':
      return await addVariable(payload);

    // Update existing variable
    case 'UPDATE_VARIABLE':
      return await updateVariable(payload);

    // Delete variable
    case 'DELETE_VARIABLE':
      return await deleteVariable(payload.id);

    // Get settings
    case 'GET_SETTINGS':
      return await storage.getSettings();

    // Update settings
    case 'UPDATE_SETTINGS':
      return await storage.setSettings(payload);

    // Track variable usage (analytics)
    case 'VARIABLE_USED':
      await trackVariableUsage(payload);
      return { success: true };

    // Get analytics
    case 'GET_ANALYTICS':
      return await getAnalytics(payload?.variableId);

    // Variables detected in page (update badge)
    case 'VARIABLES_DETECTED':
      await updateBadge(sender.tab?.id, payload.count);
      return { success: true };

    // Export data
    case 'EXPORT_DATA':
      return await exportData();

    // Import data
    case 'IMPORT_DATA':
      return await importData(payload);

    // Get pending selection for current tab
    case 'GET_PENDING_SELECTION': {
      // If sender is from popup (no tab), get the active tab
      let tabId = sender.tab?.id;
      console.log('[Service Worker] GET_PENDING_SELECTION - sender.tab?.id:', tabId);

      if (!tabId) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = activeTab?.id;
        console.log('[Service Worker] GET_PENDING_SELECTION - active tab id:', tabId);
      }

      if (!tabId) {
        console.log('[Service Worker] GET_PENDING_SELECTION - no tab id, returning null');
        return { selection: null };
      }

      const result = getPendingSelection(tabId);
      console.log('[Service Worker] GET_PENDING_SELECTION - returning:', result);
      return result;
    }

    default:
      console.warn('[Service Worker] Tipo de mensagem desconhecido:', type);
      return { error: 'Tipo de mensagem desconhecido' };
  }
}

/**
 * Add new variable
 */
async function addVariable(
  variable: Omit<Variable, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Variable> {
  try {
    const variables = await storage.getVariables();

    const newVariable: Variable = {
      ...variable,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    variables.push(newVariable);
    await storage.setVariables(variables);

    console.log('[Service Worker] Variável adicionada:', newVariable.key);
    return newVariable;
  } catch (error) {
    console.error('[Service Worker] Erro ao adicionar variável:', error);
    throw error;
  }
}

/**
 * Update existing variable
 */
async function updateVariable(updatedVariable: Variable): Promise<Variable> {
  try {
    const variables = await storage.getVariables();
    const index = variables.findIndex((v) => v.id === updatedVariable.id);

    if (index === -1) {
      throw new Error('Variável não encontrada');
    }

    variables[index] = {
      ...updatedVariable,
      updatedAt: new Date().toISOString(),
    };

    await storage.setVariables(variables);

    console.log('[Service Worker] Variável atualizada:', updatedVariable.key);
    return variables[index];
  } catch (error) {
    console.error('[Service Worker] Erro ao atualizar variável:', error);
    throw error;
  }
}

/**
 * Delete variable
 */
async function deleteVariable(id: string): Promise<void> {
  try {
    const variables = await storage.getVariables();
    const filtered = variables.filter((v) => v.id !== id);

    await storage.setVariables(filtered);

    // Remove analytics da variável
    analyticsCache.delete(id);
    await saveAnalytics();

    console.log('[Service Worker] Variável removida:', id);
  } catch (error) {
    console.error('[Service Worker] Erro ao remover variável:', error);
    throw error;
  }
}

/**
 * Track variable usage for analytics
 */
async function trackVariableUsage(data: {
  variableId: string;
  url: string;
  timestamp: string;
}): Promise<void> {
  try {
    let analytics = analyticsCache.get(data.variableId);

    if (!analytics) {
      analytics = {
        usageCount: 0,
        lastUsed: null,
        urls: [],
      };
    }

    analytics.usageCount++;
    analytics.lastUsed = data.timestamp;

    if (!analytics.urls.includes(data.url)) {
      analytics.urls.push(data.url);
      // Limita a 20 URLs para não crescer indefinidamente
      if (analytics.urls.length > 20) {
        analytics.urls.shift();
      }
    }

    analyticsCache.set(data.variableId, analytics);

    // Salva analytics a cada 5 usos para não sobrecarregar storage
    if (analytics.usageCount % 5 === 0) {
      await saveAnalytics();
    }

    console.log('[Service Worker] Uso de variável registrado:', data.variableId);
  } catch (error) {
    console.error('[Service Worker] Erro ao registrar analytics:', error);
  }
}

/**
 * Get analytics for variable(s)
 */
async function getAnalytics(variableId?: string): Promise<any> {
  try {
    await loadAnalytics();

    if (variableId) {
      return (
        analyticsCache.get(variableId) || {
          usageCount: 0,
          lastUsed: null,
          urls: [],
        }
      );
    }

    const allAnalytics: Record<string, AnalyticsData> = {};
    analyticsCache.forEach((data, id) => {
      allAnalytics[id] = data;
    });

    return allAnalytics;
  } catch (error) {
    console.error('[Service Worker] Erro ao obter analytics:', error);
    throw error;
  }
}

/**
 * Initialize analytics storage
 */
async function initializeAnalytics(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('analytics');
    if (!result.analytics) {
      await chrome.storage.local.set({ analytics: {} });
    }
  } catch (error) {
    console.error('[Service Worker] Erro ao inicializar analytics:', error);
  }
}

/**
 * Load analytics from storage
 */
async function loadAnalytics(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('analytics');
    if (result.analytics) {
      analyticsCache.clear();
      Object.entries(result.analytics).forEach(([id, data]) => {
        analyticsCache.set(id, data as AnalyticsData);
      });
    }
  } catch (error) {
    console.error('[Service Worker] Erro ao carregar analytics:', error);
  }
}

/**
 * Save analytics to storage
 */
async function saveAnalytics(): Promise<void> {
  try {
    const analyticsObj: Record<string, AnalyticsData> = {};
    analyticsCache.forEach((data, id) => {
      analyticsObj[id] = data;
    });

    await chrome.storage.local.set({ analytics: analyticsObj });
  } catch (error) {
    console.error('[Service Worker] Erro ao salvar analytics:', error);
  }
}

/**
 * Load cached data on startup
 */
async function loadCachedData(): Promise<void> {
  try {
    variablesCache = await storage.getVariables();
    await loadAnalytics();
    console.log('[Service Worker] Cache carregado:', variablesCache.length, 'variáveis');
  } catch (error) {
    console.error('[Service Worker] Erro ao carregar cache:', error);
  }
}

/**
 * Update badge on extension icon
 */
async function updateBadge(tabId: number | undefined, count: number): Promise<void> {
  if (!tabId) return;

  try {
    const settings = await storage.getSettings();

    if (count > 0) {
      await chrome.action.setBadgeText({
        text: count.toString(),
        tabId,
      });
      await chrome.action.setBadgeBackgroundColor({
        color: settings.enabled ? '#10b981' : '#6b7280', // Verde se ativo, cinza se desabilitado
        tabId,
      });
    } else {
      await chrome.action.setBadgeText({
        text: '',
        tabId,
      });
    }
  } catch (error) {
    console.error('[Service Worker] Erro ao atualizar badge:', error);
  }
}

/**
 * Export all data (variables + settings + analytics)
 */
async function exportData(): Promise<any> {
  try {
    const data = await storage.getData();
    await loadAnalytics();

    const analyticsObj: Record<string, AnalyticsData> = {};
    analyticsCache.forEach((data, id) => {
      analyticsObj[id] = data;
    });

    return {
      ...data,
      analytics: analyticsObj,
      exportedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Service Worker] Erro ao exportar dados:', error);
    throw error;
  }
}

/**
 * Import data (variables + settings + analytics)
 */
async function importData(importedData: any): Promise<void> {
  try {
    if (!importedData.version || !importedData.variables) {
      throw new Error('Formato de dados inválido');
    }

    await storage.setData({
      version: importedData.version,
      variables: importedData.variables,
      settings: importedData.settings || (await storage.getSettings()),
    });

    if (importedData.analytics) {
      analyticsCache.clear();
      Object.entries(importedData.analytics).forEach(([id, data]) => {
        analyticsCache.set(id, data as AnalyticsData);
      });
      await saveAnalytics();
    }

    console.log('[Service Worker] Dados importados com sucesso');
  } catch (error) {
    console.error('[Service Worker] Erro ao importar dados:', error);
    throw error;
  }
}

/**
 * Broadcast storage updates to all tabs
 */
async function broadcastStorageUpdate(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs
          .sendMessage(tab.id, {
            type: 'STORAGE_CHANGED',
          })
          .catch(() => {
            // Tab sem content script, ignora erro
          });
      }
    }
  } catch (error) {
    console.error('[Service Worker] Erro ao fazer broadcast:', error);
  }
}

/**
 * Storage change listener - broadcasts to all tabs
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    console.log('[Service Worker] Storage alterado:', Object.keys(changes));

    // Atualiza cache de variáveis
    if (changes.variables) {
      variablesCache = (changes.variables.newValue as Variable[]) || [];
    }

    // Notifica todas as tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: 'STORAGE_CHANGED',
              changes,
            })
            .catch(() => {
              // Ignora erros para tabs sem content script
            });
        }
      });
    });

    // Notifica popup se estiver aberto
    chrome.runtime
      .sendMessage({
        type: 'VARIABLES_UPDATED',
      })
      .catch(() => {
        // Popup não está aberto
      });
  }
});

/**
 * Global error handlers
 */
self.addEventListener('error', (event) => {
  console.error('[Service Worker] Erro não tratado:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[Service Worker] Promise rejeitada não tratada:', event.reason);
});

console.log('[Service Worker] Inicializado com sucesso');
