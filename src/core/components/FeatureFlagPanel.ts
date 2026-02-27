// FeatureFlagPanel.ts - Simplified for Vercel build
// @ts-nocheck
export class FeatureFlagPanel extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.innerHTML = '<div>Feature Flags</div>';
  }
}
customElements?.define('feature-flag-panel', FeatureFlagPanel);
