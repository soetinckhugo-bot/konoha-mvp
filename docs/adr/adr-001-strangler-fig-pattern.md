# ADR-001: Utilisation du Strangler Fig Pattern pour la Migration de RadarScoutModuleV4

## Status

**Proposed** → **Accepted** (2026-02-27)

## Context

Le module `RadarScoutModuleV4.ts` est devenu un **monolithe critique** de 1225 lignes gérant :

- Rendu HTML complet (346 lignes de template)
- Gestion d'état (12 variables privées)
- Calculs métier (percentiles, grades)
- Event handling (144 lignes de listeners)
- 3 modes d'analyse (solo, compare, benchmark)
- Intégration Chart.js pour les radars

### Problèmes Identifiés

1. **Couplage fort** : Le module dépend directement de Chart.js, du DOM, et de l'état global
2. **Testabilité limitée** : 27/37 tests passent seulement (limitation mock DOM)
3. **Risque de régression** : Toute modification touche 1225 lignes de code
4. **Duplication de code** : `calculatePercentileForRole` copié 3 fois (lignes 701, 883, 972)
5. **Responsabilités multiples** : Violation du Single Responsibility Principle

### Options Considérées

| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A - Big Bang Rewrite** | Réécrire tout le module d'un coup | Code propre final | Risque élevé, indisponibilité longue, perte de connaissances métier |
| **B - Strangler Fig Pattern** | Migrer incrémentalement, nouvelle fonctionnalité côtoie l'ancienne | Risque faible, rollback facile, validation continue | Complexité temporaire (2 systèmes en parallèle) |
| **C - Extract & Refactor** | Extraire des fonctions utilitaires sans changer l'architecture | Amélioration progressive | Ne résout pas le problème structurel fondamental |

## Decision

**Nous adoptons l'Option B : Strangler Fig Pattern.**

Le nouveau système (BMAD Architecture) sera construit **autour** de l'ancien monolithe, en interceptant progressivement les appels pour les rediriger vers les nouveaux modules.

### Architecture Cible

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FeatureFlagService                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │soloMode  │  │compare   │  │benchmark │  ← Toggle     │  │
│  │  │          │  │Mode      │  │Mode      │    runtime    │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘               │  │
│  └───────┼─────────────┼─────────────┼─────────────────────┘  │
│          │             │             │                         │
│          ▼             ▼             ▼                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Router / Facade (Strangler)                     │  │
│  │  ┌──────────────────┐    ┌──────────────────┐           │  │
│  │  │  Nouveau Système │    │  Ancien Monolithe│           │  │
│  │  │  (BMAD)          │◄──►│  (V4 Legacy)     │           │  │
│  │  │                  │    │                  │           │  │
│  │  │ • RadarModule    │    │ • V4.ts (1225L)  │           │  │
│  │  │ • PercentileSvc  │    │                  │           │  │
│  │  │ • Store          │    │                  │           │  │
│  │  └──────────────────┘    └──────────────────┘           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Légende: ───► Nouveau code    ──► Ancien code                │
│           Migration progressive : Ancien → Nouveau             │
└─────────────────────────────────────────────────────────────────┘
```

### Composants du Nouveau Système

```
BMAD Architecture
│
├── Core
│   ├── Store (State Management)     ← Centralise l'état
│   ├── EventBus (Pub/Sub)           ← Découplage
│   └── FeatureFlagService           ← Déjà implémenté ✓
│
├── Modules
│   ├── RadarModule
│   │   ├── RadarChart (Chart.js)    ← Adapter pattern
│   │   ├── PercentileService        ← Extrait de V4
│   │   └── GradeService             ← Existant, uniformiser
│   │
│   ├── PlayerModule
│   │   ├── PlayerSelect             ← Extrait de V4
│   │   └── PlayerFilter             ← Extrait de V4
│   │
│   ├── LeaderboardModule
│   │   ├── LeaderboardView          ← Extrait de V4
│   │   └── RankingService           ← Extrait de V4
│   │
│   └── ComparisonModule (NEW)
│       ├── CompareView              ← Nouveau
│       ├── BenchmarkView            ← Nouveau
│       └── DuelView (expérimental)  ← Feature flag
│
└── UI
    ├── Components                   ← Réutilisables
    └── FeatureFlagPanel             ← Déjà implémenté ✓
```

## Consequences

### Positives

1. **Risque Réduit**
   - Pas d'indisponibilité du service
   - Rollback immédiat via feature flags
   - Tests de régression avec characterization tests

2. **Validation Continue**
   - Chaque module migré est testé indépendamment
   - Comportement inchangé garanti par les tests
   - Feedback utilisateur sur les nouvelles fonctionnalités

3. **Apprentissage Incrémental**
   - L'équipe apprend la nouvelle architecture progressivement
   - Documentation générée au fil de l'eau
   - Meilleure compréhension du métier

4. **Flexibilité**
   - Feature flags permettent A/B testing
   - Activation progressive par utilisateur/rôle
   - Désactivation d'urgence si bug critique

### Negatives

1. **Complexité Temporaire**
   - Deux systèmes en parallèle pendant 8 semaines
   - Double maintenance (bug fixes sur ancien et nouveau)
   - Documentation à maintenir pour les deux systèmes

2. **Performance**
   - Overhead du routing (négligeable, <1ms)
   - Double chargement potentiel de certains composants
   - Bundle size légèrement augmenté pendant la transition

3. **Dette Technique Temporaire**
   - Code mort dans l'ancien système progressivement
   - Interfaces de compatibilité à maintenir
   - Tests doublonnés (characterization + nouveaux)

### Migration des Données

**Pas de migration de données nécessaire.** Les données (joueurs, stats) restent inchangées. Seule la couche de présentation et de logique métier évolue.

## Implémentation

### Phase 1 : Infrastructure (Semaines 1-2)

```typescript
// 1. Créer la facade
class RadarModuleRouter {
  private legacyModule: RadarScoutModuleV4;
  private newModule: RadarModule;
  
  render(mode: 'solo' | 'compare' | 'benchmark') {
    if (FeatureFlagService.isEnabled(`${mode}Mode`)) {
      return this.newModule.render(mode);
    }
    return this.legacyModule.render();
  }
}
```

### Phase 2 : Extraction Services (Semaines 3-4)

- Extraction `PercentileService` (fonction pure, déjà testée ✓)
- Extraction `GradeService` (uniformiser l'existant)
- Extraction `PlayerFilterService`

### Phase 3 : Modules UI (Semaines 5-6)

- `PlayerSelectModule` → Remplace dropdown V4
- `LeaderboardModule` → Remplace classement V4
- `CentilesPanelModule` → Remplace panneau percentiles

### Phase 4 : Mode Comparison (Semaine 7)

- Refonte complète du mode compare/benchmark
- Intégration `DuelView` (expérimental, feature flag)

### Phase 5 : Cleanup (Semaine 8)

- Suppression `RadarScoutModuleV4.ts`
- Suppression des feature flags obsolètes
- Documentation finale

## Références

- [Strangler Fig Pattern - Martin Fowler](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Feature Toggles - Martin Fowler](https://martinfowler.com/articles/feature-toggles.html)
- [Characterization Tests - Michael Feathers](https://www.artima.com/weblogs/viewpost.jsp?thread=341406)
- BMAD Phase 1 : Characterization Tests (27/37 passant)
- BMAD Phase 1 : Feature Flags System (22/22 passant)

## Notes

- **Date de décision** : 2026-02-27
- **Décideur** : hugo (Lead Developer)
- **Reviewers** : Équipe Konoha-MVP
- **Prochaine revue** : Fin Phase 1 (Semaine 2)

---

*Ce document est vivant et sera mis à jour au fil de la migration.*
