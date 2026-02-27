/**
 * PlayerSelectModule - Module BMAD de sélection de joueur
 * 
 * Responsabilité : Afficher et gérer le dropdown de sélection de joueur
 * Pattern : Module BMAD avec injection de dépendances
 * 
 * @example
 * const module = new PlayerSelectModule(playerFilterService);
 * module.render(context); // Monte le dropdown
 */

import { IBaseModule, IModuleContext, Player } from '../../../core/types/bmad';
import { PlayerFilterService } from '../services/PlayerFilterService';

export interface PlayerSelectConfig {
  showTeam?: boolean;
  showRole?: boolean;
  placeholder?: string;
  allowClear?: boolean;
}

export class PlayerSelectModule implements IBaseModule {
  readonly id = 'player-select';
  
  private context: IModuleContext | null = null;
  private container: HTMLElement | null = null;
  private selectElement: HTMLSelectElement | null = null;
  private config: PlayerSelectConfig;
  
  // Callbacks pour cleanup
  private unsubscribers: (() => void)[] = [];

  constructor(
    private playerFilterService: PlayerFilterService,
    config: PlayerSelectConfig = {}
  ) {
    this.config = {
      showTeam: true,
      showRole: false,
      placeholder: 'Sélectionner un joueur...',
      allowClear: true,
      ...config
    };
  }

  /**
   * Rendu initial du module
   * Crée le container et le dropdown
   */
  render(context: IModuleContext): void {
    this.context = context;
    this.container = this.createContainer(context.container);
    
    // Rendu initial
    this.renderDropdown();
    
    // Souscription aux changements de rôle
    const unsubscribe = context.store.subscribe('currentRole', () => {
      this.handleRoleChange();
    });
    this.unsubscribers.push(unsubscribe);
    
    // Souscription aux changements de joueurs
    const unsubscribePlayers = context.store.subscribe('players', () => {
      this.renderDropdown();
    });
    this.unsubscribers.push(unsubscribePlayers);
  }

  /**
   * Mise à jour du module (optimisée)
   * Ne recrée pas le DOM, juste met à jour les options
   */
  update(context: IModuleContext): void {
    this.context = context;
    
    // Mise à jour sélective si le dropdown existe
    if (this.selectElement) {
      this.updateOptions();
    } else {
      // Fallback : recréation complète
      this.renderDropdown();
    }
  }

  /**
   * Destruction propre du module
   * Nettoie les listeners et le DOM
   */
  destroy(): void {
    // Unsubscribe all
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    // Cleanup DOM
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.container = null;
    this.selectElement = null;
    this.context = null;
  }

  /**
   * Crée le container du module
   */
  private createContainer(parent: HTMLElement): HTMLElement {
    const container = document.createElement('div');
    container.className = 'bmad-player-select-module';
    container.setAttribute('data-module-id', this.id);
    parent.appendChild(container);
    return container;
  }

  /**
   * Rend le dropdown complet
   */
  private renderDropdown(): void {
    if (!this.container || !this.context) return;
    
    // Clear container
    this.container.innerHTML = '';
    
    // Crée le wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'player-select-wrapper';
    
    // Label
    const label = document.createElement('label');
    label.className = 'player-select-label';
    label.textContent = 'Joueur';
    wrapper.appendChild(label);
    
    // Crée le select
    this.selectElement = document.createElement('select');
    this.selectElement.className = 'player-select-dropdown';
    
    // Option vide si allowClear
    if (this.config.allowClear) {
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = this.config.placeholder || '';
      this.selectElement.appendChild(emptyOption);
    }
    
    // Remplit les options
    this.populateOptions();
    
    // Event listener
    this.selectElement.addEventListener('change', (e) => {
      this.handlePlayerChange((e.target as HTMLSelectElement).value);
    });
    
    // Sélectionne le joueur courant
    const currentPlayer = this.context.selectedPlayer;
    if (currentPlayer) {
      this.selectElement.value = currentPlayer.id;
    }
    
    wrapper.appendChild(this.selectElement);
    this.container.appendChild(wrapper);
  }

  /**
   * Remplit les options du dropdown
   */
  private populateOptions(): void {
    if (!this.selectElement || !this.context) return;
    
    const players = this.context.store.getState<Player[]>('players') || [];
    const currentRole = this.context.store.getState<string>('currentRole') || 'ALL';
    
    // Filtre par rôle
    const filteredPlayers = this.playerFilterService.filterByRole(
      players,
      currentRole
    );
    
    // Trie par nom
    const sortedPlayers = this.playerFilterService.sortByName(filteredPlayers);
    
    // Crée les options
    sortedPlayers.forEach(player => {
      const option = document.createElement('option');
      option.value = player.id;
      option.textContent = this.formatPlayerLabel(player);
      this.selectElement!.appendChild(option);
    });
  }

  /**
   * Met à jour les options sans recréer le select
   * (optimisation pour update())
   */
  private updateOptions(): void {
    if (!this.selectElement || !this.context) return;
    
    // Sauvegarde la valeur sélectionnée
    const selectedValue = this.selectElement.value;
    
    // Clear options (sauf la première si allowClear)
    const startIndex = this.config.allowClear ? 1 : 0;
    while (this.selectElement.options.length > startIndex) {
      this.selectElement.remove(startIndex);
    }
    
    // Remplit à nouveau
    this.populateOptions();
    
    // Restaure la sélection si possible
    if (selectedValue) {
      const optionExists = Array.from(this.selectElement.options)
        .some(opt => opt.value === selectedValue);
      if (optionExists) {
        this.selectElement.value = selectedValue;
      }
    }
  }

  /**
   * Formate le label d'un joueur
   */
  private formatPlayerLabel(player: Player): string {
    const parts = [player.name];
    
    if (this.config.showTeam && player.team) {
      parts.push(`(${player.team})`);
    }
    
    if (this.config.showRole && player.role) {
      parts.push(`[${player.role}]`);
    }
    
    return parts.join(' ');
  }

  /**
   * Gère le changement de joueur
   */
  private handlePlayerChange(playerId: string): void {
    if (!this.context) return;
    
    if (!playerId) {
      // Clear sélection
      this.context.store.setState('selectedPlayer', null);
      this.emitPlayerSelected(null);
      return;
    }
    
    const players = this.context.store.getState<Player[]>('players') || [];
    const player = players.find(p => p.id === playerId);
    
    if (player) {
      this.context.store.setState('selectedPlayer', player);
      this.emitPlayerSelected(player);
    }
  }

  /**
   * Gère le changement de rôle (réaffichage)
   */
  private handleRoleChange(): void {
    this.renderDropdown();
  }

  /**
   * Émet l'événement player:selected
   */
  private emitPlayerSelected(player: Player | null): void {
    if (!this.context) return;
    
    // Événement personnalisé
    const event = new CustomEvent('bmad:player:selected', {
      detail: { player, moduleId: this.id },
      bubbles: true
    });
    
    this.container?.dispatchEvent(event);
    
    // Log BMAD
    console.log(`[${this.id}] Player selected:`, player?.name || 'none');
  }

  // ============================================================
  // API Publique
  // ============================================================

  /**
   * Sélectionne un joueur par ID
   */
  selectPlayer(playerId: string): void {
    if (this.selectElement) {
      this.selectElement.value = playerId;
      this.handlePlayerChange(playerId);
    }
  }

  /**
   * Retourne le joueur sélectionné
   */
  getSelectedPlayer(): Player | null {
    return this.context?.selectedPlayer || null;
  }

  /**
   * Met à jour la configuration
   */
  setConfig(config: Partial<PlayerSelectConfig>): void {
    this.config = { ...this.config, ...config };
    this.renderDropdown();
  }
}
