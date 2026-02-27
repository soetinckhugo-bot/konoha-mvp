# 🎯 HANDOFF - Refactor BMAD KONOHA MVP

**Date** : Session actuelle  
**Dernier commit** : `f48b4ee` - Fix: Initialize leaderboard on first render  
**État** : Fonctionnel mais dette technique importante (mode cowboy)

---

## ✅ Ce qui fonctionne (Features complètes)

### Radar Module V4
- Radar Chart.js avec points colorés par tier (S/A/B/C/D)
- 3 modes : Solo / Comparison / Benchmark
- Expand overlay (fullscreen) avec vrai radar
- Toggle Percentiles / Values

### Leaderboard
- 10 joueurs visibles sans scroll
- Grades Player Tiers (S/A/B/C) colorés
- Score moyen calculé
- Rangs 1-2-3 dorés/argentés/bronzés

### Percentile Analysis
- Vue By Categories (Fight/Vision/Resources)
- Vue Table (liste simple des métriques)
- Barres de progression avec glow
- Valeurs colorées selon le tier

### Header Radar
- Nom joueur + Rôle (tag coloré) + Équipe
- Badge Tier (S/A/B/C coloré) + Avg Score
- Toggle Percentiles/Values

---

## ⚠️ Dette technique (Cowboy code à refactor)

### 1. Fichier monolithique
**Fichier** : `src/modules/radar-scout/RadarScoutModuleV4.ts` (1200+ lignes)

**Problèmes** :
- Mix render HTML + logique métier + event handlers
- Méthodes trop longues (updateView, updateLeaderboard, etc.)
- Duplication de calculs (percentiles calculés dans plusieurs méthodes)

### 2. State management dispersé
- Variables d'instance dans la classe (`currentMode`, `currentRole`)
- DOM comme source de vérité (querySelector pour lire l'état)
- Chart.js avec son propre state
- Pas de store centralisé

### 3. Duplications
- Calcul des percentiles : dans `updateView`, `updateCentilesPanel`, `updateLeaderboard`, `updateTableView`
- Logique des grades : dans les méthodes + dans GradeCalculator
- Filtrage des joueurs par rôle : répété 5+ fois

### 4. Pas de tests
- GradeCalculator : pas de tests unitaires
- RadarDataService : pas de tests
- Calculs de percentiles : pas vérifiés

---

## 🎯 Mission Refactor BMAD

### Objectif
Transformer le code cowboy en architecture propre BMAD sans casser les features.

### Étapes recommandées

#### 1. **Séparer le Render** (haute priorité)
Créer des composants dédiés :
```
src/modules/radar-scout/components/
├── RadarHeader.ts          # Header avec nom/role/team/tier/avg
├── RadarChartContainer.ts  # Container radar + bouton expand
├── RadarLegend.ts          # Légende comparaison (cards joueurs)
├── Leaderboard.ts          # Liste leaderboard complète
├── PercentilePanel.ts      # Panel avec tabs Categories/Table
└── PlayerTiersCard.ts      # Carte Player Tiers (référence)
```

Chaque composant :
- Sa méthode `render()` qui retourne HTML
- Sa méthode `update(data)` pour refresh
- Ses event handlers internes

#### 2. **Centraliser le State** (haute priorité)
Créer un store simple :
```typescript
// src/modules/radar-scout/store/RadarStore.ts
interface RadarState {
  currentRole: string;
  currentMode: 'solo' | 'compare' | 'benchmark';
  selectedPlayerId: string | null;
  comparedPlayerId: string | null;
  selectedMetrics: string[];
  viewMode: 'percentiles' | 'values';
  players: Player[];
}
```

- Un seul point de vérité
- Méthodes `setState()` et `getState()`
- Subscriptions pour les composants

#### 3. **Extraire les calculs** (moyenne priorité)
Créer des services purs (sans side effects) :
```
src/modules/radar-scout/services/
├── PercentileCalculator.ts    # Tous les calculs de percentiles
├── PlayerRankingService.ts    # Classement + scores
├── MetricFilterService.ts     # Filtrage métriques par role/timeframe
└── TierCalculator.ts          # Déjà existant, à compléter
```

#### 4. **Tests unitaires** (basse priorité mais important)
```
src/modules/radar-scout/__tests__/
├── GradeCalculator.test.ts
├── PercentileCalculator.test.ts
└── PlayerRankingService.test.ts
```

### Seuils de tiers (à préserver)

**Player Tiers** (pour score global 0-100) :
- S (Elite) : 75-100
- A (Excellent) : 60-75
- B (Good) : 50-60
- C (Weak) : <50

**Stats Tiers** (pour percentiles 0-100) :
- S (Elite) : 90-100
- A (Excellent) : 75-90
- B (Good) : 55-75
- C (Average) : 35-55
- D (Weak) : <35

### Design System V4 (à préserver)

**Couleurs** :
```css
--v4-bg: #0D0D12
--v4-bg-card: #1A1D2B
--v4-accent: #00D4FF (dynamique par rôle)
--tier-s: #3FE0D0
--tier-a: #22C55E
--tier-b: #FACC15
--tier-c: #F59E0B
--tier-d: #EF4444
```

**Roles** :
- TOP : #FF4444
- JUNGLE : #00E676
- MID : #00D4FF
- ADC : #FFD700
- SUPPORT : #E040FB

---

## 📁 Fichiers clés à connaître

| Fichier | Description | État |
|---------|-------------|------|
| `RadarScoutModuleV4.ts` | Module principal (1200+ lignes) | 🔴 Refactor urgent |
| `RadarChart.ts` | Wrapper Chart.js | 🟢 Stable |
| `GradeCalculator.ts` | Calcul des grades | 🟡 Compléter tests |
| `RadarDataService.ts` | Génération config radar | 🟡 Déplacer logique |
| `radar-v4.css` | Design system complet | 🟢 Stable |
| `types.ts` | Types + seuils des grades | 🟢 Stable (modifiés) |

---

## 🚀 Commandes de base

```bash
# Build
npm run build

# Dev
npm run dev

# Vérification TypeScript
npx tsc --noEmit
```

---

## ⚡ Points d'attention

1. **Ne pas casser les features** : Tester après chaque étape
2. **Conserver le design** : Les couleurs/glows doivent rester identiques
3. **Performance** : Chart.js animation désactivée (<100ms)
4. **Mobile** : Grid responsive déjà en place

---

**Contexte conversation** :
- Projet fonctionnel mais code devenu spaghetti
- Besoin de revenir à l'architecture BMAD propre
- Méthode BMAD avec workflow CB recommandée
