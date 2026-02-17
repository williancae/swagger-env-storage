/**
 * Message passing helpers for communication between components
 */

export type MessageType =
  // Storage operations
  | 'GET_VARIABLES'
  | 'ADD_VARIABLE'
  | 'UPDATE_VARIABLE'
  | 'DELETE_VARIABLE'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  // Analytics
  | 'VARIABLE_USED'
  | 'GET_ANALYTICS'
  // Badge and notifications
  | 'VARIABLES_DETECTED'
  // Import/Export
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  // Broadcast notifications
  | 'VARIABLES_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'STORAGE_CHANGED'
  // Actions
  | 'FORCE_REPLACE'
  | 'GET_SELECTION'
  | 'SELECTION_FOR_VARIABLE';

export interface Message {
  type: MessageType;
  payload?: any;
  changes?: any;
}

/**
 * Send message to background service worker
 */
export async function sendMessage(message: Message): Promise<any> {
  return chrome.runtime.sendMessage(message);
}

/**
 * Send message to specific tab
 */
export async function sendMessageToTab(tabId: number, message: Message): Promise<any> {
  return chrome.tabs.sendMessage(tabId, message);
}

/**
 * Listen for messages
 */
export function onMessage(callback: (message: Message, sender: chrome.runtime.MessageSender) => void | Promise<any>): void {
  chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    const result = callback(message, sender);

    if (result instanceof Promise) {
      result.then(sendResponse).catch((error) => {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
      });
      return true; // Keep channel open for async response
    }

    return false;
  });
}
