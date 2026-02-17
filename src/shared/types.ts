/**
 * TypeScript interfaces and types for Swagger Environment Variables extension
 */

export interface Variable {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
  hosts: string[];
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  enabled: boolean;
  caseSensitive: boolean;
  replacementTrigger: 'onblur' | 'manual' | 'onsubmit';
  shortcutKey: string;
  theme: ThemeMode;
}

export interface StorageData {
  version: string;
  variables: Variable[];
  settings: Settings;
}

export type ReplacementTrigger = 'onblur' | 'manual' | 'onsubmit';

/**
 * Message types for communication between extension components
 */
export type MessageType =
  // Storage operations
  | 'GET_VARIABLES'
  | 'ADD_VARIABLE'
  | 'UPDATE_VARIABLE'
  | 'DELETE_VARIABLE'
  // Settings
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  // Analytics
  | 'VARIABLE_USED'
  | 'GET_ANALYTICS'
  | 'VARIABLES_DETECTED'
  // Data transfer
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  // Content script actions
  | 'FORCE_REPLACE'
  // Selection handling
  | 'GET_SELECTION'
  | 'GET_PENDING_SELECTION';

/**
 * Base message structure for extension messaging
 */
export interface BaseMessage {
  type: MessageType;
}

/**
 * Message to get selected text from active tab
 */
export interface GetSelectionMessage extends BaseMessage {
  type: 'GET_SELECTION';
}

/**
 * Response containing selected text
 */
export interface SelectionResponse {
  success: boolean;
  selection?: string;
  error?: string;
}

/**
 * Message to get pending selection stored in service worker
 */
export interface GetPendingSelectionMessage extends BaseMessage {
  type: 'GET_PENDING_SELECTION';
}

/**
 * Response containing pending selection data
 */
export interface PendingSelectionResponse {
  success: boolean;
  selection?: string;
  error?: string;
}

/**
 * Union type of all possible messages
 */
export type Message =
  | GetSelectionMessage
  | GetPendingSelectionMessage
  | BaseMessage;

/**
 * Union type of all possible message responses
 */
export type MessageResponse =
  | SelectionResponse
  | PendingSelectionResponse
  | { success: boolean; data?: any; error?: string };
