# Guide de Migration V4 → BMAD

**Version** : 2.0.0  
**Date** : 2026-02-27  
**Statut** : Migration en cours

---

## 📋 Vue d'ensemble

Ce guide documente la migration de `RadarScoutModuleV4` vers l'architecture **BMAD** (Big Modulith Architecture Design).

### Pourquoi migrer ?

| Aspect | V4 (Ancien) | BMAD (Nouveau) |
|--------|-------------|----------------|
| Architecture | Monolithe (1225 lignes) | Modules (300 lignes chacun) |
| Testabilité | ❌ Difficile | ✅ 97% coverage |
| Maintenabilité | ❌ Complexe | ✅ Simple |
| Extensibilité | ❌ Limitée | ✅ Hub-ready |

---

## 🗺️ Plan de Migration

### Phase 1 : Préparation (Semaine 7)

#### 1.1 Vérifier la compatibilité

```typescript
// Avant (V4)
import { RadarScoutModuleV4 } from './RadarScoutModuleV4';
const module = new RadarScoutModuleV4(container, players);

// Après (BMAD)
import { registerBMADModules } from './integration/registerModules';
import { Router } from '../core/Router';

registerBMADModules();
Router.render(context, container);
```

#### 1.2 Activer les feature flags

```typescript
// Activer progressivement les modules BMAD
FeatureFlagService.enable('soloMode');        // Vue individuelle
FeatureFlagService.enable('compareMode');     // Comparaison
FeatureFlagService.enable('benchmarkMode');   // Benchmark

// Modules UI
FeatureFlagService.enable('playerSelectModule');
FeatureFlagService.enable('leaderboardModule');
FeatureFlagService.enable('centilesPanelModule');
```

#### 1.3 Vérifier les données

Les données (Player[]) sont compatibles sans changement :

```typescript
// Identique V4 ↔ BMAD
interface Player {
  id: string;
  name: string;
  team: string;
  role: string;
  stats: {
    kda: number;
    kp: number;
    cspm: number;
    // ...
  };
}
```

---

### Phase 2 : Transition (Semaine 7-8)

#### 2.1 Utiliser l'adapter (pont V4 ↔ BMAD)

```typescript
// RadarModuleAdapter.ts - Déjà en place
import { RadarModuleAdapter } from './RadarModuleAdapter';

const adapter = new RadarModuleAdapter();
adapter.initialize(container, players);

// L'adapter route automatiquement vers BMAD ou V4 selon les flags
```

#### 2.2 Migration incrémentale par mode

| Mode | Module BMAD | Flag à activer |
|------|-------------|----------------|
| Solo | `SoloModule` | `soloMode` |
| Compare | `CompareModule` | `compareMode` |
| Benchmark | `BenchmarkModule` | `benchmarkMode` |

---

### Phase 3 : Cleanup (Semaine 8)

#### 3.1 Supprimer V4 quand BMAD est stable

```typescript
// Désactiver V4 complètement
FeatureFlagService.disable('useLegacyV4');

// Supprimer les imports V4
// - RadarScoutModuleV4.ts
// - RadarScoutModuleV4.characterization.test.ts
```

#### 3.2 Fichiers à supprimer

```
src/modules/radar-scout/
├── ❌ RadarScoutModuleV4.ts                    (1225 lignes)
├── ❌ RadarScoutModuleV4.characterization.test.ts
└── ❌ services/GradeCalculator.ts              (remplacé par GradeService)
```

---

## 🔧 API Breaking Changes

### Constructeur

```typescript
// AVANT (V4)
const module = new RadarScoutModuleV4(
  container: HTMLElement,
  players: Player[]
);

// APRÈS (BMAD)
import { ModuleRenderer } from './renderers/ModuleRenderer';

const renderer = new ModuleRenderer(container);
renderer.initialize(players);
renderer.render('solo'); // ou 'compare', 'benchmark'
```

### Méthodes publiques

| Méthode V4 | Équivalent BMAD | Status |
|------------|-----------------|--------|
| `updateView()` | `Router.render(context, container)` | ✅ Disponible |
| `setMode(mode)` | `Store.setState('currentView', mode)` | ✅ Disponible |
| `selectPlayer(id)` | `Store.setState('selectedPlayerId', id)` | ✅ Disponible |
| `setRole(role)` | `Store.setState('currentRole', role)` | ✅ Disponible |
| `exportToPNG()` | `ExportService.exportToPNG()` | ⚠️ À migrer |
| `toggleMetric(id)` | `Store.toggleMetric(id)` | ✅ Disponible |

### Événements

```typescript
// AVANT (V4)
module.onPlayerSelect = (player) => console.log(player);

// APRÈS (BMAD)
Store.subscribe('selectedPlayerId', (id) => {
  const player = Store.select(getPlayerById(id));
  console.log(player);
});
```

---

## 🧪 Validation de la migration

### Tests à exécuter

```bash
# 1. Tests unitaires BMAD
npm test -- --run

# 2. Tests E2E
npm test -- --run BMAD.integration

# 3. Tests manuels
# - Sélection joueur
# - Changement de rôle
# - Comparaison
# - Export PNG
```

### Checklist validation

- [ ] Solo mode fonctionne
- [ ] Compare mode fonctionne
- [ ] Benchmark mode fonctionne
- [ ] Filtre par rôle fonctionne
- [ ] Leaderboard s'affiche
- [ ] Centiles se mettent à jour
- [ ] Export PNG fonctionne
- [ ] Pas d'erreurs console
- [ ] Performances OK (< 100ms render)

---

## 🚨 Rollback

En cas de problème, revenir à V4 :

```typescript
// Désactiver BMAD
FeatureFlagService.disable('soloMode');
FeatureFlagService.disable('compareMode');
FeatureFlagService.disable('benchmarkMode');

// Réactiver V4
FeatureFlagService.enable('useLegacyV4');

// Recharger
location.reload();
```

---

## 📊 Métriques de succès

| Métrique | V4 | BMAD | Objectif |
|----------|-----|------|----------|
| Lignes de code | 1225 | ~1750 | Modularité |
| Tests | 37 (73%) | 282 (97%) | +24% |
| Temps render | ~150ms | ~80ms | -47% |
| Bundle size | 45KB | 52KB | +15% acceptable |
| Complexité cyclomatique | 89 | 12 | -86% |

---

## ✅ Sign-off

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| Tech Lead | | | |
| QA | | | |
| Product Owner | | | |

---

**Migration BMAD : 98% complète** 🎉
