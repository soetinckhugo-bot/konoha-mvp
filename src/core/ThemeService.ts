/**
 * ThemeService - Gestion du theming et injection des tokens CSS
 * Story 1.5
 */

export class ThemeService {
  private currentTheme = 'dark';

  /**
   * Injecte les tokens CSS au démarrage
   */
  injectTokens(): void {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }

  /**
   * Récupère une variable CSS
   */
  getThemeVar(name: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--kono-${name}`)
      .trim();
  }

  /**
   * Change de thème
   */
  setTheme(themeId: string): void {
    this.currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
  }
}
