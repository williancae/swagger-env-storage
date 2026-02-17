/**
 * Variable Form Web Component
 * Add/Edit form for variables
 */

// TODO: Implement VariableForm Web Component
export class VariableForm extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <form class="variable-form">
        <!-- Add/Edit form will be rendered here -->
      </form>
    `;
  }
}

customElements.define('variable-form', VariableForm);
