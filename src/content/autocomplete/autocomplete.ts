/**
 * Autocomplete - Shows dropdown with available variables when user types {{
 */

import type { Variable } from '@/shared/types';

export class Autocomplete {
  private dropdown: HTMLDivElement | null = null;
  private currentInput: HTMLElement | null = null;
  private variables: Variable[] = [];
  private selectedIndex = 0;
  private filterText = '';
  private onSelect: (variableName: string) => void;

  constructor(onSelect: (variableName: string) => void) {
    this.onSelect = onSelect;
    this.createDropdown();
    this.attachKeyboardListeners();
  }

  private createDropdown(): void {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'swagger-envs-autocomplete';
    this.dropdown.setAttribute('role', 'listbox');
    this.dropdown.setAttribute('aria-label', 'Variáveis de ambiente');
    this.injectStyles();
    this.dropdown.style.display = 'none';

    document.body.appendChild(this.dropdown);
  }

  private injectStyles(): void {
    if (document.getElementById('swagger-envs-autocomplete-styles')) return;

    const style = document.createElement('style');
    style.id = 'swagger-envs-autocomplete-styles';
    style.textContent = `
      .swagger-envs-autocomplete {
        position: fixed;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
        max-height: 240px;
        overflow-y: auto;
        z-index: 10000;
        min-width: 220px;
        max-width: 320px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
      }
      .swagger-envs-autocomplete .autocomplete-item {
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.1s ease;
      }
      .swagger-envs-autocomplete .autocomplete-item:last-child {
        border-bottom: none;
      }
      .swagger-envs-autocomplete .autocomplete-item:hover,
      .swagger-envs-autocomplete .autocomplete-item.selected {
        background: #eff6ff;
        color: #1e40af;
      }
      .swagger-envs-autocomplete .autocomplete-item .autocomplete-item-key {
        font-weight: 600;
        display: block;
      }
      .swagger-envs-autocomplete .autocomplete-item .autocomplete-item-desc {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }
      .swagger-envs-autocomplete .autocomplete-empty {
        padding: 12px;
        color: #94a3b8;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  private attachKeyboardListeners(): void {
    document.addEventListener('keydown', (e) => {
      if (!this.isVisible()) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          this.confirmSelection();
          break;
        case 'Escape':
          e.preventDefault();
          this.hide();
          break;
      }
    });
  }

  setVariables(variables: Variable[]): void {
    this.variables = variables.filter(v => v.enabled);
  }

  show(input: HTMLElement, cursorX: number, cursorY: number): void {
    if (!this.dropdown) return;

    this.currentInput = input;
    this.filterText = '';
    this.selectedIndex = 0;

    this.updatePosition(cursorX, cursorY);
    this.renderItems();

    this.dropdown.style.display = 'block';
  }

  hide(): void {
    if (this.dropdown) {
      this.dropdown.style.display = 'none';
    }
    this.currentInput = null;
  }

  isVisible(): boolean {
    return this.dropdown?.style.display === 'block';
  }

  updateFilter(text: string): void {
    this.filterText = text;
    this.selectedIndex = 0;
    this.renderItems();
  }

  private getFilteredVariables(): Variable[] {
    if (!this.filterText) {
      return this.variables;
    }

    const lowerFilter = this.filterText.toLowerCase();
    return this.variables.filter(v =>
      v.key.toLowerCase().includes(lowerFilter)
    );
  }

  private renderItems(): void {
    if (!this.dropdown) return;

    const filtered = this.getFilteredVariables();

    if (filtered.length === 0) {
      this.dropdown.innerHTML = '<div class="autocomplete-empty">Nenhuma variável encontrada</div>';
      return;
    }

    this.dropdown.innerHTML = filtered
      .map((variable, index) => {
        const isSelected = index === this.selectedIndex;
        const keyEsc = this.escapeHtml(variable.key);
        const descEsc = variable.description ? this.escapeHtml(variable.description) : '';
        return `
          <div
            class="autocomplete-item ${isSelected ? 'selected' : ''}"
            data-index="${index}"
            data-key="${this.escapeAttr(variable.key)}"
            role="option"
            ${isSelected ? 'aria-selected="true"' : ''}
          >
            <span class="autocomplete-item-key">${keyEsc}</span>
            ${descEsc ? `<span class="autocomplete-item-desc">${descEsc}</span>` : ''}
          </div>
        `;
      })
      .join('');

    this.dropdown.querySelectorAll('.autocomplete-item').forEach((item) => {
      item.addEventListener('click', () => {
        const key = item.getAttribute('data-key');
        if (key) {
          this.insertVariable(key);
        }
      });
      item.addEventListener('mouseenter', () => {
        const index = item.getAttribute('data-index');
        if (index !== null) {
          this.selectedIndex = parseInt(index, 10);
          this.renderItems();
        }
      });
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private escapeAttr(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private updatePosition(viewportX: number, viewportY: number): void {
    if (!this.dropdown) return;

    const padding = 8;
    const gap = 6;
    const maxHeight = 240;
    const minWidth = 220;
    const maxWidth = Math.min(320, window.innerWidth - padding * 2);
    const dropdownWidth = maxWidth;

    let top = viewportY + gap;
    let left = viewportX;

    const spaceBelow = window.innerHeight - viewportY - padding;
    const spaceAbove = viewportY - padding;

    if (spaceBelow >= maxHeight || spaceBelow >= spaceAbove) {
      top = viewportY + gap;
      if (top + maxHeight > window.innerHeight - padding) {
        top = window.innerHeight - maxHeight - padding;
      }
    } else {
      top = viewportY - maxHeight - gap;
      if (top < padding) {
        top = padding;
      }
    }

    if (left + dropdownWidth > window.innerWidth - padding) {
      left = window.innerWidth - dropdownWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    this.dropdown.style.top = `${top}px`;
    this.dropdown.style.left = `${left}px`;
    this.dropdown.style.width = `${dropdownWidth}px`;
  }

  private selectNext(): void {
    const filtered = this.getFilteredVariables();
    if (filtered.length === 0) return;

    this.selectedIndex = (this.selectedIndex + 1) % filtered.length;
    this.renderItems();
  }

  private selectPrevious(): void {
    const filtered = this.getFilteredVariables();
    if (filtered.length === 0) return;

    this.selectedIndex = this.selectedIndex - 1;
    if (this.selectedIndex < 0) {
      this.selectedIndex = filtered.length - 1;
    }
    this.renderItems();
  }

  private confirmSelection(): void {
    const filtered = this.getFilteredVariables();
    if (filtered.length === 0) return;

    const selected = filtered[this.selectedIndex];
    if (selected) {
      this.insertVariable(selected.key);
    }
  }

  private insertVariable(key: string): void {
    if (!this.currentInput) return;

    if (this.currentInput instanceof HTMLInputElement || this.currentInput instanceof HTMLTextAreaElement) {
      const value = this.currentInput.value;
      const cursorPos = this.currentInput.selectionStart || 0;

      // Find the {{ before cursor
      const beforeCursor = value.substring(0, cursorPos);
      const lastBracePos = beforeCursor.lastIndexOf('{{');

      if (lastBracePos !== -1) {
        // Replace from {{ to cursor with {{key}}
        const newValue =
          value.substring(0, lastBracePos) +
          `{{${key}}}` +
          value.substring(cursorPos);

        this.currentInput.value = newValue;

        // Set cursor after the inserted variable
        const newCursorPos = lastBracePos + key.length + 4; // {{ + key + }}
        this.currentInput.setSelectionRange(newCursorPos, newCursorPos);

        // Trigger input event
        this.currentInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    this.hide();
    this.onSelect(key);
  }

  destroy(): void {
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
    }
  }
}
