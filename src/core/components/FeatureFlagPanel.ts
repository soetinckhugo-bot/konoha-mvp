/**
 * @fileoverview Feature Flag Admin Panel
 * UI pour activer/désactiver les feature flags
 * 
 * @example
 * // Ajouter au layout principal
 * const panel = new FeatureFlagPanel();
 * panel.render(container);
 */

import { FeatureFlagService, FeatureFlagKey, FeatureFlags } from '../services/FeatureFlagService';

interface FlagConfig {
  key: FeatureFlagKey;
  label: string;
  description: string;
  category: 'mode' | 'ui' | 'experimental';
}

const FLAG_CONFIGS: FlagConfig[] = [
  // Modes d'analyse
  { key: 'soloMode', label: 'Mode Solo', description: 'Analyse individuelle', category: 'mode' },
  { key: 'compareMode', label: 'Mode Comparaison', description: '1 vs 1', category: 'mode' },
  { key: 'benchmarkMode', label: 'Mode Benchmark', description: 'vs Moyenne', category: 'mode' },
  
  // Features UI
  { key: 'centilesPanel', label: 'Panneau Percentiles', description: 'Analyse Fight/Vision/Resources', category: 'ui' },
  { key: 'leaderboard', label: 'Leaderboard', description: 'Classement Top 12', category: 'ui' },
  { key: 'exportPNG', label: 'Export PNG', description: 'Telecharger les graphiques', category: 'ui' },
  { key: 'overlayChart', label: 'Radar Plein Ecran', description: 'Overlay expand', category: 'ui' },
  
  // Experimental
  { key: 'teamMode', label: 'Mode Equipe (5v5)', description: 'Comparaison equipes', category: 'experimental' },
  { key: 'quadMode', label: 'Mode Quad (1v1v1v1)', description: '4 joueurs simultanes', category: 'experimental' },
  { key: 'duelMode', label: 'Mode Duel', description: 'VS plein ecran avec proba', category: 'experimental' },
];

export class FeatureFlagPanel {
  private container: HTMLElement | null = null;
  private unsubscribers: (() => void)[] = [];
  
  /**
   * Rend le panneau d'administration
   */
  public render(parent: HTMLElement): void {
    this.container = document.createElement('div');
    this.container.className = 'feature-flag-panel';
    this.container.innerHTML = `
      <style>
        .feature-flag-panel {
          background: #1a1a2e;
          border: 1px solid #2d2d44;
          border-radius: 12px;
          padding: 16px;
          max-width: 400px;
          font-family: system-ui, -apple-system, sans-serif;
          color: #e0e0e0;
        }
        .ff-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #2d2d44;
        }
        .ff-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ff-badge {
          background: #3FE0D0;
          color: #0a0a0f;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
        }
        .ff-reset-btn {
          background: transparent;
          border: 1px solid #444;
          color: #888;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ff-reset-btn:hover {
          border-color: #666;
          color: #fff;
        }
        .ff-category {
          margin-bottom: 16px;
        }
        .ff-category-title {
          font-size: 11px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .ff-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #0f0f1a;
          border-radius: 8px;
          margin-bottom: 8px;
          transition: background 0.2s;
        }
        .ff-item:hover {
          background: #161626;
        }
        .ff-item.overridden {
          border-left: 3px solid #F59E0B;
        }
        .ff-item.disabled {
          opacity: 0.5;
        }
        .ff-info {
          flex: 1;
        }
        .ff-label {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ff-desc {
          font-size: 11px;
          color: #666;
          margin-top: 2px;
        }
        .ff-tag {
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 3px;
          font-weight: 600;
        }
        .ff-tag.experimental {
          background: #7C3AED;
          color: #fff;
        }
        .ff-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          cursor: pointer;
        }
        .ff-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .ff-slider {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #333;
          border-radius: 24px;
          transition: 0.3s;
        }
        .ff-slider:before {
          content: '';
          position: absolute;
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.3s;
        }
        .ff-toggle input:checked + .ff-slider {
          background: #22C55E;
        }
        .ff-toggle input:checked + .ff-slider:before {
          transform: translateX(20px);
        }
        .ff-url-hint {
          margin-top: 12px;
          padding: 10px;
          background: #0f0f1a;
          border-radius: 6px;
          font-size: 11px;
          color: #666;
        }
        .ff-url-hint code {
          color: #3FE0D0;
          font-family: monospace;
        }
        .ff-status {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          margin-left: 6px;
        }
        .ff-status.url {
          background: #F59E0B;
          color: #000;
        }
        .ff-status.local {
          background: #3B82F6;
          color: #fff;
        }
      </style>
      
      <div class="ff-header">
        <div class="ff-title">
          <span>Feature Flags</span>
          <span class="ff-badge">ADMIN</span>
        </div>
        <button class="ff-reset-btn" id="ff-reset-all">Reset All</button>
      </div>
      
      <div id="ff-categories"></div>
      
      <div class="ff-url-hint">
        <strong>URL Override:</strong><br>
        <code>?ff_compareMode=false&amp;ff_teamMode=true</code>
      </div>
    `;
    
    parent.appendChild(this.container);
    this.renderCategories();
    this.attachEventHandlers();
    this.subscribeToChanges();
  }
  
  /**
   * Rend les categories de flags
   */
  private renderCategories(): void {
    const categoriesContainer = this.container!.querySelector('#ff-categories');
    if (!categoriesContainer) return;
    
    const categories: Record<string, string> = {
      mode: 'Modes d\'Analyse',
      ui: 'Interface',
      experimental: 'Experimental',
    };
    
    const flags = FeatureFlagService.getAll();
    
    Object.entries(categories).forEach(([catKey, catLabel]) => {
      const catFlags = FLAG_CONFIGS.filter(f => f.category === catKey);
      if (catFlags.length === 0) return;
      
      const catDiv = document.createElement('div');
      catDiv.className = 'ff-category';
      catDiv.innerHTML = `
        <div class="ff-category-title">${catLabel}</div>
        ${catFlags.map(flag => this.renderFlagItem(flag, flags[flag.key])).join('')}
      `;
      categoriesContainer.appendChild(catDiv);
    });
  }
  
  /**
   * Rend un item de flag
   */
  private renderFlagItem(config: FlagConfig, value: boolean): string {
    const isOverridden = FeatureFlagService.isOverriddenByURL(config.key);
    const experimentalTag = config.category === 'experimental' 
      ? '<span class="ff-tag experimental">BETA</span>' 
      : '';
    const statusTag = isOverridden 
      ? '<span class="ff-status url">URL</span>' 
      : '<span class="ff-status local">LOCAL</span>';
    
    return `
      <div class="ff-item ${isOverridden ? 'overridden' : ''} ${!value ? 'disabled' : ''}" data-flag="${config.key}">
        <div class="ff-info">
          <div class="ff-label">
            ${config.label}
            ${experimentalTag}
            ${statusTag}
          </div>
          <div class="ff-desc">${config.description}</div>
        </div>
        <label class="ff-toggle">
          <input type="checkbox" ${value ? 'checked' : ''} ${isOverridden ? 'disabled' : ''} data-flag="${config.key}">
          <span class="ff-slider"></span>
        </label>
      </div>
    `;
  }
  
  /**
   * Attache les event handlers
   */
  private attachEventHandlers(): void {
    // Reset all button
    const resetBtn = this.container!.querySelector('#ff-reset-all');
    resetBtn?.addEventListener('click', () => {
      if (confirm('Reinitialiser tous les flags aux valeurs par defaut ?')) {
        FeatureFlagService.resetAll();
        this.refresh();
      }
    });
    
    // Toggle switches
    const toggles = this.container!.querySelectorAll('.ff-toggle input[data-flag]');
    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const flag = (e.target as HTMLElement).getAttribute('data-flag') as FeatureFlagKey;
        const checked = (e.target as HTMLInputElement).checked;
        
        if (checked) {
          FeatureFlagService.enable(flag);
        } else {
          FeatureFlagService.disable(flag);
        }
      });
    });
  }
  
  /**
   * S'abonne aux changements externes
   */
  private subscribeToChanges(): void {
    const unsubscribe = FeatureFlagService.onChange((key, value) => {
      // Met a jour l'UI si changement externe
      const toggle = this.container!.querySelector(`input[data-flag="${key}"]`);
      if (toggle) {
        (toggle as HTMLInputElement).checked = value;
      }
      
      // Met a jour le style disabled
      const item = this.container!.querySelector(`.ff-item[data-flag="${key}"]`);
      if (item) {
        item.classList.toggle('disabled', !value);
      }
    });
    
    this.unsubscribers.push(unsubscribe);
  }
  
  /**
   * Rafraichit l'affichage complet
   */
  public refresh(): void {
    const categoriesContainer = this.container!.querySelector('#ff-categories');
    if (categoriesContainer) {
      categoriesContainer.innerHTML = '';
      this.renderCategories();
    }
  }
  
  /**
   * Detruit le panneau et nettoie les listeners
   */
  public destroy(): void {
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
  }
}

export default FeatureFlagPanel;
