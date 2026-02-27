/**
 * @fileoverview Router - Strangler Fig Pattern Facade
 * Route les appels entre l'ancien monolithe V4 et le nouveau systeme BMAD
 * 
 * @example
 * // Enregistrer un nouveau module
 * Router.register('solo', new SoloModule());
 * 
 * // Utiliser le legacy
 * Router.useLegacy('compare', () => legacyModule.render());
 * 
 * // Rendre selon les feature flags
 * const element = Router.render(context, container);
 */

import type { 
  BMADModule, 
  RenderContext, 
  IModuleRouter 
} from './types/bmad';
import { FeatureFlagService } from './services/FeatureFlagService';
import Store from './Store';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration d'une route
 */
interface RouteConfig {
  mode: string;
  module?: BMADModule;
  legacyRenderer?: () => HTMLElement;
  featureFlag: string;
}

/**
 * Metriques de routing (pour monitoring)
 */
interface RoutingMetrics {
  totalRenders: number;
  newSystemRenders: number;
  legacyRenders: number;
  averageRenderTime: number;
}

// ============================================================================
// Router Class - Strangler Fig Facade
// ============================================================================

export class ModuleRouter implements IModuleRouter {
  private static instance: ModuleRouter;
  private routes: Map<string, RouteConfig>;
  private container: HTMLElement | null;
  private currentMode: string | null;
  private metrics: RoutingMetrics;
  private renderStartTime: number;
  
  private constructor() {
    this.routes = new Map();
    this.container = null;
    this.currentMode = null;
    this.metrics = {
      totalRenders: 0,
      newSystemRenders: 0,
      legacyRenders: 0,
      averageRenderTime: 0,
    };
    this.renderStartTime = 0;
    
    // Ecouter les changements de feature flags
    FeatureFlagService.onChange((key) => {
      // Si un flag de mode change, re-render si necessaire
      if (key.endsWith('Mode')) {
        console.log(`[Router] Feature flag changed: ${key}, may trigger re-render`);
      }
    });
  }
  
  /**
   * Singleton
   */
  public static getInstance(): ModuleRouter {
    if (!ModuleRouter.instance) {
      ModuleRouter.instance = new ModuleRouter();
    }
    return ModuleRouter.instance;
  }
  
  /**
   * Alias statique pour getInstance
   */
  public static get router(): ModuleRouter {
    return ModuleRouter.getInstance();
  }
  
  // ============================================================================
  // Registration
  // ============================================================================
  
  /**
   * Enregistre un module BMAD pour un mode
   */
  public register(mode: string, module: BMADModule, featureFlag?: string): void {
    const flag = featureFlag || `${mode}Mode`;
    
    this.routes.set(mode, {
      mode,
      module,
      featureFlag: flag,
    });
    
    console.log(`[Router] Registered module '${module.id}' for mode '${mode}' (flag: ${flag})`);
  }
  
  /**
   * Enregistre une fonction legacy pour un mode
   */
  public useLegacy(mode: string, legacyRenderer: () => HTMLElement, featureFlag?: string): void {
    const flag = featureFlag || `${mode}Mode`;
    const existing = this.routes.get(mode);
    
    if (existing) {
      // Conserver le module s'il existe, ajouter le legacy
      existing.legacyRenderer = legacyRenderer;
      console.log(`[Router] Added legacy fallback for mode '${mode}'`);
    } else {
      this.routes.set(mode, {
        mode,
        legacyRenderer,
        featureFlag: flag,
      });
      console.log(`[Router] Registered legacy renderer for mode '${mode}' (flag: ${flag})`);
    }
  }
  
  /**
   * Desenregistre un mode
   */
  public unregister(mode: string): void {
    this.routes.delete(mode);
    console.log(`[Router] Unregistered mode '${mode}'`);
  }
  
  // ============================================================================
  // Rendering
  // ============================================================================
  
  /**
   * Rend le module approprie selon le contexte
   * C'est le coeur du Strangler Fig Pattern
   */
  public render(context: RenderContext, container: HTMLElement): HTMLElement {
    this.renderStartTime = performance.now();
    this.container = container;
    this.currentMode = context.mode;
    
    const route = this.routes.get(context.mode);
    
    if (!route) {
      console.warn(`[Router] No route found for mode '${context.mode}', rendering fallback`);
      return this.renderFallback(container);
    }
    
    // Decision: Nouveau systeme ou Legacy?
    const useNewSystem = this.shouldUseNewSystem(route);
    
    let result: HTMLElement;
    
    if (useNewSystem && route.module) {
      // Utiliser le nouveau systeme BMAD
      result = this.renderNewSystem(route.module, context, container);
    } else if (route.legacyRenderer) {
      // Fallback sur le legacy
      result = this.renderLegacy(route.legacyRenderer, container);
    } else {
      // Ni nouveau ni legacy - erreur
      console.error(`[Router] No renderer available for mode '${context.mode}'`);
      result = this.renderError(container, `No renderer for mode '${context.mode}'`);
    }
    
    // Mettre a jour les metriques
    this.updateMetrics(useNewSystem);
    
    return result;
  }
  
  /**
   * Met a jour le rendu avec un nouveau contexte
   */
  public update(context: RenderContext): void {
    if (!this.container || this.currentMode !== context.mode) {
      // Mode change ou pas de container - re-render complet
      if (this.container) {
        this.container.innerHTML = '';
        this.render(context, this.container);
      }
      return;
    }
    
    // Meme mode - update incrementale
    const route = this.routes.get(context.mode);
    if (route?.module) {
      route.module.update(context);
    }
  }
  
  /**
   * Detruit le rendu actuel
   */
  public destroy(): void {
    const route = this.currentMode ? this.routes.get(this.currentMode) : null;
    
    if (route?.module) {
      route.module.destroy();
    }
    
    this.container = null;
    this.currentMode = null;
  }
  
  // ============================================================================
  // Private Render Methods
  // ============================================================================
  
  private shouldUseNewSystem(route: RouteConfig): boolean {
    // Verifier le feature flag
    const isEnabled = FeatureFlagService.isEnabled(
      route.featureFlag as any
    );
    
    // Verifier si le module existe
    const hasModule = !!route.module;
    
    return isEnabled && hasModule;
  }
  
  private renderNewSystem(
    module: BMADModule, 
    context: RenderContext, 
    container: HTMLElement
  ): HTMLElement {
    console.log(`[Router] Rendering NEW system for mode '${context.mode}'`);
    
    try {
      module.init();
      module.render(container);
      
      this.metrics.newSystemRenders++;
      
      return container;
    } catch (error) {
      console.error(`[Router] Error rendering new system:`, error);
      
      // Fallback sur legacy si disponible
      const route = this.routes.get(context.mode);
      if (route?.legacyRenderer) {
        console.log(`[Router] Falling back to legacy after error`);
        container.innerHTML = '';
        return this.renderLegacy(route.legacyRenderer, container);
      }
      
      return this.renderError(container, 'Rendering error');
    }
  }
  
  private renderLegacy(
    legacyRenderer: () => HTMLElement, 
    container: HTMLElement
  ): HTMLElement {
    console.log(`[Router] Rendering LEGACY system`);
    
    try {
      const legacyElement = legacyRenderer();
      
      // Si le legacy retourne un element different du container
      if (legacyElement !== container) {
        container.innerHTML = '';
        container.appendChild(legacyElement);
      }
      
      this.metrics.legacyRenders++;
      
      return container;
    } catch (error) {
      console.error(`[Router] Error rendering legacy:`, error);
      return this.renderError(container, 'Legacy rendering error');
    }
  }
  
  private renderFallback(container: HTMLElement): HTMLElement {
    container.innerHTML = `
      <div style="
        padding: 40px;
        text-align: center;
        color: #666;
        font-family: system-ui;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">🚧</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
          Mode non disponible
        </div>
        <div style="font-size: 13px;">
          Ce mode d'analyse n'est pas encore implemente.
        </div>
      </div>
    `;
    return container;
  }
  
  private renderError(container: HTMLElement, message: string): HTMLElement {
    container.innerHTML = `
      <div style="
        padding: 40px;
        text-align: center;
        color: #EF4444;
        font-family: system-ui;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
          Erreur de rendu
        </div>
        <div style="font-size: 13px; color: #666;">
          ${message}
        </div>
      </div>
    `;
    return container;
  }
  
  // ============================================================================
  // Metrics & Monitoring
  // ============================================================================
  
  private updateMetrics(useNewSystem: boolean): void {
    this.metrics.totalRenders++;
    
    const renderTime = performance.now() - this.renderStartTime;
    
    // Moyenne mobile pour le temps de rendu
    this.metrics.averageRenderTime = 
      (this.metrics.averageRenderTime * (this.metrics.totalRenders - 1) + renderTime) 
      / this.metrics.totalRenders;
    
    // Log si lent
    if (renderTime > 100) {
      console.warn(`[Router] Slow render detected: ${renderTime.toFixed(2)}ms`);
    }
  }
  
  /**
   * Recupere les metriques de routing
   */
  public getMetrics(): RoutingMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Reset les metriques
   */
  public resetMetrics(): void {
    this.metrics = {
      totalRenders: 0,
      newSystemRenders: 0,
      legacyRenders: 0,
      averageRenderTime: 0,
    };
  }
  
  // ============================================================================
  // Query Methods
  // ============================================================================
  
  /**
   * Verifie si le nouveau systeme est actif pour un mode
   */
  public isNewSystemActive(mode: string): boolean {
    const route = this.routes.get(mode);
    if (!route) return false;
    return this.shouldUseNewSystem(route);
  }
  
  /**
   * Liste les modes enregistres
   */
  public getRegisteredModes(): string[] {
    return Array.from(this.routes.keys());
  }
  
  /**
   * Liste les modes utilisant le nouveau systeme
   */
  public getNewSystemModes(): string[] {
    return this.getRegisteredModes().filter(mode => this.isNewSystemActive(mode));
  }
  
  /**
   * Liste les modes utilisant le legacy
   */
  public getLegacyModes(): string[] {
    return this.getRegisteredModes().filter(mode => !this.isNewSystemActive(mode));
  }
  
  /**
   * Recupere le mode courant
   */
  public getCurrentMode(): string | null {
    return this.currentMode;
  }
}

// Export singleton
export const Router = ModuleRouter.getInstance();
export default Router;
