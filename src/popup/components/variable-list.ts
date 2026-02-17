/**
 * Variable List Web Component
 * Displays list of variables in popup
 */

// TODO: Implement VariableList Web Component
export class VariableList extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="variable-list">
        <!-- Variable list will be rendered here -->
      </div>
    `;
  }
}

customElements.define('variable-list', VariableList);
