/**
 * Quick Toggle Web Component
 * Toggle extension enabled/disabled in popup
 */

// TODO: Implement QuickToggle Web Component
export class QuickToggle extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="quick-toggle">
        <!-- Toggle UI will be rendered here -->
      </div>
    `;
  }
}

customElements.define('quick-toggle', QuickToggle);
