/**
 * DOM Observer - Observe DOM changes and detect new fields
 */

import { debounce } from '@/shared/utils';

export class DOMObserver {
  private observer: MutationObserver | null = null;
  private onNodesAdded: (nodes: Element[]) => void;
  private debounceTime: number;
  private isObserving = false;

  constructor(onNodesAdded: (nodes: Element[]) => void, debounceTime = 300) {
    this.onNodesAdded = onNodesAdded;
    this.debounceTime = debounceTime;
  }

  start(): void {
    if (this.isObserving) {
      console.warn('[DOMObserver] Already observing');
      return;
    }

    const debouncedHandler = debounce(this.handleMutations.bind(this), this.debounceTime);

    this.observer = new MutationObserver(debouncedHandler);

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false, // Don't observe attribute changes for performance
    });

    this.isObserving = true;
    console.log('[DOMObserver] Started observing DOM changes (debounce:', this.debounceTime, 'ms)');
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.isObserving = false;
      console.log('[DOMObserver] Stopped observing');
    }
  }

  isActive(): boolean {
    return this.isObserving;
  }

  private handleMutations(mutations: MutationRecord[]): void {
    const addedElements: Element[] = [];
    const processedNodes = new Set<Node>();

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // Avoid processing duplicates
        if (processedNodes.has(node)) {
          return;
        }

        processedNodes.add(node);

        if (node.nodeType === Node.ELEMENT_NODE) {
          addedElements.push(node as Element);
        }
      });
    });

    if (addedElements.length > 0) {
      console.log('[DOMObserver] Detected', addedElements.length, 'new elements');
      this.onNodesAdded(addedElements);
    }
  }
}
