// RoleFilterModule.ts - BMAD Pattern
// @ts-nocheck
import type { BMADModule } from '../core/types';

export class RoleFilterModule implements BMADModule {
  readonly id = 'role-filter';
  private container: HTMLElement | null = null;
  private coordinator: any = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="v4-roles-grid">
        <button class="v4-role-btn active" data-role="ALL">
          <span class="v4-role-icon">🌐</span>
          <span class="v4-role-label">ALL</span>
        </button>
        <button class="v4-role-btn" data-role="TOP">
          <span class="v4-role-icon">🛡️</span>
          <span class="v4-role-label">TOP</span>
        </button>
        <button class="v4-role-btn" data-role="JUNGLE">
          <span class="v4-role-icon">🌿</span>
          <span class="v4-role-label">JGL</span>
        </button>
        <button class="v4-role-btn" data-role="MID">
          <span class="v4-role-icon">⚡</span>
          <span class="v4-role-label">MID</span>
        </button>
        <button class="v4-role-btn" data-role="ADC">
          <span class="v4-role-icon">🏹</span>
          <span class="v4-role-label">ADC</span>
        </button>
        <button class="v4-role-btn" data-role="SUPPORT">
          <span class="v4-role-icon">💚</span>
          <span class="v4-role-label">SUP</span>
        </button>
      </div>
    `;

    container.querySelectorAll('.v4-role-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleRoleClick(e));
    });
  }

  update(state: any): void {
    this.container?.querySelectorAll('.v4-role-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.role === state.currentRole);
    });
  }

  private handleRoleClick(e: Event): void {
    const btn = e.currentTarget as HTMLElement;
    const role = btn.dataset.role;
    
    this.container?.querySelectorAll('.v4-role-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    this.coordinator.setState('currentRole', role);
    
    // Mettre à jour le thème visuel
    document.querySelector('.v4-layout')?.setAttribute('data-role', role || 'ALL');
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
