/**
 * CentileBar Component - Visualisation des centiles avec barre de progression
 * FR24-FR26 - Feature Pack V2
 */

import type { MetricConfig, Player } from '../../../core/types';
import { GradeCalculator } from '../services/GradeCalculator';

export interface CentileBarProps {
  metric: MetricConfig;
  player: Player;
  percentile: number;
  value: number;
  showGrade?: boolean;
  context?: string; // ex: "LEC ADCs"
  displayMode?: 'percentiles' | 'values'; // Mode d'affichage
}

export class CentileBar {
  private container: HTMLElement | null = null;

  render(props: CentileBarProps): HTMLElement {
    try {
      const { metric, percentile, value, showGrade = true, context, displayMode = 'percentiles' } = props;
      
      const grade = GradeCalculator.getGrade(percentile);
      const formattedValue = this.formatValue(value, metric);
      
      // Calculer le "Top X%" (inverse du percentile)
      const topPercent = Math.max(1, Math.round(100 - percentile));
      
      this.container = document.createElement('div');
      this.container.className = 'centile-bar-container';
      
      // Affichage selon le mode: percentiles (défaut) ou values
      const displayValue = displayMode === 'values' 
        ? formattedValue 
        : `${Math.round(percentile)}`;
      
      const displayLabel = displayMode === 'values'
        ? 'Value'
        : `${Math.round(percentile)}e centile`;
      
      this.container.innerHTML = `
        <div class="centile-header">
          <div class="centile-metric">
            <span class="metric-icon">${metric.icon || '📊'}</span>
            <span class="metric-name">${metric.name}</span>
          </div>
          <div class="centile-value-section">
            ${showGrade ? `<span class="grade-badge grade-${grade.toLowerCase()}">${grade}</span>` : ''}
            <span class="centile-percent-value" style="color: ${GradeCalculator.getGradeColor(grade)}">${displayValue}</span>
          </div>
        </div>
        
        <div class="centile-bar-wrapper">
          <div class="centile-bar-bg">
            <div class="centile-bar-fill grade-${grade.toLowerCase()}" style="width: ${percentile}%"></div>
            <div class="centile-marker" style="left: ${percentile}%"></div>
          </div>
        </div>
        
        <div class="centile-footer">
          <span class="centile-context">Top ${topPercent}%${context ? ` ${context}` : ''}</span>
          <span class="centile-percentile">${displayLabel}</span>
        </div>
      `;

      return this.container;
    } catch (error) {
      console.error('[CentileBar] Render error:', error);
      this.container = document.createElement('div');
      this.container.className = 'centile-bar-container error';
      this.container.innerHTML = '<span class="error-text">-</span>';
      return this.container;
    }
  }

  private formatValue(value: number, metric: MetricConfig): string {
    if (value === undefined || value === null) return '-';
    
    const decimals = metric.decimals ?? 1;
    
    switch (metric.format) {
      case 'percentage':
        return `${value.toFixed(decimals)}%`;
      case 'integer':
        return Math.round(value).toString();
      case 'decimal':
      default:
        return value.toFixed(decimals);
    }
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
  }
}
