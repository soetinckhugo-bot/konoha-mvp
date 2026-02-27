# Roadmap BMAD Phase 2 - Migration RadarScoutModuleV4

**Période** : 8 Semaines  
**Objectif** : Migrer le monolithe V4 (1225 lignes) vers l'architecture BMAD  
**Approche** : Strangler Fig Pattern + Feature Flags  

---

## Vue d'Ensemble

```
Semaine:  1    2    3    4    5    6    7    8
         ├────┼────┼────┼────┼────┼────┼────┤
Phase 1   [ Infrastructure & Router ]
Phase 2          [ Extraction Services  ]
Phase 3                              [ UI ]
Phase 4                                          [Cleanup]
         ▲              ▲              ▲              ▲
         Jalon 1        Jalon 2        Jalon 3        Jalon 4
         Router OK      Services OK    Modules OK     V4 Supprimé
```

---

## Semaine 1 : Infrastructure Core

### Objectifs
- Mettre en place le système de routing (Strangler Facade)
- Configurer les feature flags pour la migration
- Créer les interfaces du nouveau système

### Livrables

| Livrable | Fichier | Critère d'Acceptation |
|----------|---------|----------------------|
| **Router** | `src/core/Router.ts` | Route les appels vers V4 ou nouveau selon flags |
| **Interfaces** | `src/core/types/bmad.ts` | Définit les contrats entre modules |
| **Store** | `src/core/Store.ts` | State management centralisé (remplace variables V4) |
| **Tests Router** | `Router.test.ts` | 100% coverage du routing logic |

### Tâches Détaillées

#### Jour 1-2 : Router
```typescript
// src/core/Router.ts
export class ModuleRouter {
  private legacy: RadarScoutModuleV4;
  private modules: Map<string, BMADModule>;
  
  render(context: RenderContext): HTMLElement {
    const flag = `${context.mode}Mode`;
    if (FeatureFlagService.isEnabled(flag)) {
      return this.modules.get(context.mode)!.render(context);
    }
    return this.legacy.render();
  }
}
```

- [ ] Créer la classe Router
- [ ] Implémenter la logique de fallback (V4 si flag désactivé)
- [ ] Tests unitaires (cas nominal + edge cases)

#### Jour 3-4 : Store
```typescript
// src/core/Store.ts
interface AppState {
  players: Player[];
  selectedPlayerId: string | null;
  selectedMetrics: string[];
  currentView: 'solo' | 'compare' | 'benchmark';
  // ... remplace les 12 variables privées de V4
}
```

- [ ] Définir le state global
- [ ] Implémenter subscribe/notify pattern
- [ ] Tests : changements de state, listeners

#### Jour 5 : Interfaces
- [ ] Définir `BMADModule` interface
- [ ] Définir `RenderContext` type
- [ ] Documenter les contrats

### Définitions de Fait (DoD)
- [ ] Router 100% testé
- [ ] Store fonctionnel avec 3+ subscribers
- [ ] Documentation API complète

### Risques
| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Incompatibilité API V4 | Moyenne | Élevé | Adapter pattern, tests d'intégration |
| Performance routing | Faible | Moyen | Benchmarks dès semaine 1 |

---

## Semaine 2 : Facade & Intégration

### Objectifs
- Intégrer le Router avec l'application existante
- Déployer en production (derrière feature flags)
- Valider le comportement inchangé

### Livrables

| Livrable | Description | Validation |
|----------|-------------|------------|
| **Integration** | Router branché sur l'app | Aucune régression détectée |
| **Feature Flags Prod** | Flags configurés | Tous les flags sur V4 par défaut |
| **Monitoring** | Logs/metrics routing | Temps de routing < 1ms |

### Tâches Détaillées

#### Jour 1-2 : Intégration Application
- [ ] Modifier le point d'entrée pour utiliser Router
- [ ] Créer adapters pour compatibilité V4
- [ ] Tests d'intégration (E2E)

#### Jour 3-4 : Déploiement Progressif
- [ ] Déployer sur environnement staging
- [ ] Tests manuels (parcours utilisateur)
- [ ] Mettre en production (flags = V4)

#### Jour 5 : Validation
- [ ] Exécuter characterization tests
- [ ] Vérifier : 27/27 tests passent toujours
- [ ] Documentation : état de la migration

### Jalon 1 : Infrastructure Stable 🎯
**Critères :**
- Router en production, traffic 100% V4
- Zero downtime déployé
- Monitoring actif

---

## Semaine 3 : Extraction Services - Partie 1

### Objectifs
- Extraire `PercentileService` (fonction pure)
- Extraire `GradeService` (uniformisation)
- Migrer vers nouveau système avec feature flag

### Livrables

| Service | Lignes V4 | Nouveau Fichier | Tests |
|---------|-----------|-----------------|-------|
| **PercentileService** | L1088-1112 | `src/services/PercentileService.ts` | 100% coverage |
| **GradeService** | L724-733, 1043-1057 | `src/services/GradeService.ts` | 100% coverage |

### Tâches Détaillées

#### Jour 1-2 : PercentileService
```typescript
// Déjà testé via characterization tests (6/6 passent)
// → Copier/coller avec cleanup
export class PercentileService {
  calculate(value: number, values: number[], inverted: boolean): number {
    // Extraction pure de V4
  }
}
```

- [ ] Extraire le code de V4
- [ ] Ajouter documentation JSDoc
- [ ] Valider : characterization tests passent

#### Jour 3-4 : GradeService
```typescript
// Uniformiser GradeCalculator existant
export class GradeService {
  getGrade(percentile: number): 'S' | 'A' | 'B' | 'C' | 'D';
  getColor(grade: string): string;
  getLabel(grade: string): string;
}
```

- [ ] Fusionner GradeCalculator + logique V4
- [ ] Résoudre conflits thresholds (7 tests legacy)
- [ ] Tous les tests passent

#### Jour 5 : Feature Flag Activation
- [ ] Activer `useNewPercentileService` flag (désactivé par défaut)
- [ ] Tests A/B : comparer résultats V4 vs nouveau
- [ ] Documenter écarts (devraient être zero)

### Définitions de Fait
- [ ] Services testés indépendamment
- [ ] Characterization tests toujours passent
- [ ] Feature flag documenté

---

## Semaine 4 : Extraction Services - Partie 2

### Objectifs
- Extraire `PlayerFilterService`
- Extraire `MetricCalculationService`
- Intégrer au nouveau système

### Livrables

| Service | Source V4 | Destination | Validation |
|---------|-----------|-------------|------------|
| **PlayerFilterService** | L542-559 | `src/services/PlayerFilterService.ts` | Filtres identiques |
| **MetricCalculationService** | L651-801 (partie calcul) | `src/services/MetricService.ts` | Calculs identiques |

### Tâches

#### Jour 1-3 : PlayerFilterService
- [ ] Extraire logique de filtrage
- [ ] Extraire tri/ranking
- [ ] Tests avec mock data (10 joueurs)

#### Jour 4-5 : MetricCalculationService
- [ ] Extraire calcul scores
- [ ] Extraire normalisation métriques
- [ ] Benchmark perfs (doit être plus rapide)

### Jalon 2 : Services Extraits 🎯
**Critères :**
- 4 services indépendants
- Feature flags par service
- Tests > 90% coverage

---

## Semaine 5 : Modules UI - Partie 1

### Objectifs
- Créer `PlayerSelectModule`
- Créer `RoleSelectorModule`
- Remplacer composants V4 incrémentalement

### Livrables

| Module | Remplace (V4) | Feature Flag | Validation |
|--------|---------------|--------------|------------|
| **PlayerSelectModule** | L46-49, L542-559 | `newPlayerSelect` | UX identique |
| **RoleSelectorModule** | Lignes roles | `newRoleSelector` | UX identique |

### Tâches

#### Jour 1-3 : PlayerSelectModule
```typescript
export class PlayerSelectModule implements BMADModule {
  render(props: PlayerSelectProps): HTMLElement {
    // Dropdown avec recherche
    // Filtre par rôle
    // Format "Nom (Equipe)"
  }
}
```

- [ ] Composant autonome
- [ ] Event handling
- [ ] Intégration Store

#### Jour 4-5 : RoleSelectorModule
- [ ] Boutons roles (TOP, JUNGLE, MID, ADC, SUPPORT)
- [ ] Gestion active state
- [ ] Intégration PlayerSelectModule

### Tests
- [ ] Tests unitaires (interactions)
- [ ] Tests visuels (Storybook si dispo)

---

## Semaine 6 : Modules UI - Partie 2

### Objectifs
- Créer `LeaderboardModule`
- Créer `CentilesPanelModule`
- Intégrer au layout

### Livrables

| Module | Source V4 | Validation |
|--------|-----------|------------|
| **LeaderboardModule** | L991-1086 | Top 12, grades S/A/B/C |
| **CentilesPanelModule** | L855-931 | 3 catégories, barres percentiles |

### Tâches

#### Jour 1-3 : LeaderboardModule
- [ ] Liste scrollable
- [ ] Cartes joueurs (rank, nom, équipe, grade)
- [ ] Mise à jour temps réel (Store)

#### Jour 4-5 : CentilesPanelModule
- [ ] 3 catégories : Fight, Vision, Resources
- [ ] Barres de progression
- [ ] Toggle percentiles/valeurs
- [ ] Export PNG

### Jalon 3 : Modules UI Complets 🎯
**Critères :**
- Tous les modules UI créés
- Feature flags fonctionnels
- Parité visuelle avec V4

---

## Semaine 7 : Mode Comparison & Benchmark

### Objectifs
- Refonte complète mode Compare (1v1)
- Refonte mode Benchmark (vs moyenne)
- Mode Duel expérimental (feature flag)

### Livrables

| Mode | Feature | Validation |
|------|---------|------------|
| **Compare** | 2 joueurs côte à côte | Interaction fluide |
| **Benchmark** | Joueur vs moyenne rôle | Calculs identiques V4 |
| **Duel** (exp) | VS plein écran + proba | UX moderne, behind flag |

### Tâches

#### Jour 1-3 : CompareModule
- [ ] Sélection 2 joueurs
- [ ] Radar overlay
- [ ] Légende personnalisée
- [ ] Stats comparatives

#### Jour 4-5 : BenchmarkModule + DuelModule
- [ ] Calcul moyenne par rôle
- [ ] Affichage différentiel
- [ ] DuelMode (expérimental)
  - Plein écran
  - Probabilité victoire
  - Design modernisé

### Tests Critiques
- [ ] Comparaison 2 joueurs : résultats identiques V4
- [ ] Benchmark : moyennes correctes
- [ ] Performance : rendu < 100ms

---

## Semaine 8 : Cleanup & Finalisation

### Objectifs
- Supprimer `RadarScoutModuleV4.ts`
- Supprimer feature flags temporaires
- Documentation finale
- Formation équipe

### Livrables

| Tâche | Détails | Validation |
|-------|---------|------------|
| **Suppression V4** | Remplacer par Router uniquement | Build passe |
| **Cleanup Flags** | Retirer flags migration | Config propre |
| **Doc** | README architecture | Review équipe |
| **Demo** | Présentation nouvelle archi | Validation PO |

### Planning

#### Jour 1-2 : Suppression
- [ ] Retirer `RadarScoutModuleV4.ts`
- [ ] Retirer imports obsolètes
- [ ] Mettre à jour tests (retirer characterization V4)

#### Jour 3-4 : Documentation
- [ ] README architecture BMAD
- [ ] Guide contribution
- [ ] ADR-002 (cleanup)

#### Jour 5 : Celebration 🎉
- [ ] Demo équipe
- [ ] Rétrospective
- [ ] Bilan : 1225 lignes → ~400 lignes modulaires

### Jalon 4 : Migration Terminée 🎯
**Critères :**
- Zero fichier V4
- 100% nouveau système
- Documentation complète
- Équipe formée

---

## Résumé des Jalons

| Jalon | Date | Critère | Owner |
|-------|------|---------|-------|
| **J1** | Semaine 2 | Infrastructure stable, Router prod | hugo |
| **J2** | Semaine 4 | 4 services extraits, testés | hugo |
| **J3** | Semaine 6 | Modules UI complets | hugo |
| **J4** | Semaine 8 | V4 supprimé, doc OK | hugo |

---

## Ressources & Dépendances

### Équipe
- **1 développeur** (hugo) - Full-time sur la migration
- **Revue** - 1h/semaine validation jalons

### Outils
- Tests : Vitest (characterization + unit)
- Feature Flags : FeatureFlagService (implémenté)
- Monitoring : Console logs + timing

### Risques Globaux

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Dérive délai | Moyenne | Moyen | Jalons clairs, scope figé |
| Régression utilisateur | Faible | Élevé | Feature flags, rollback rapide |
| Complexité sous-estimée | Moyenne | Moyen | Buffer semaine 8, tests continus |
| Dépendance externe (Chart.js) | Faible | Élevé | Adapter pattern, abstraction |

---

## Métriques de Succès

### Quantitatives
- [ ] Coverage tests > 80%
- [ ] Zero régression (characterization tests)
- [ ] Performance ≥ V4 (mêmes temps de rendu)
- [ ] Bundle size ≤ +10% (pendant transition), puis -30% (après cleanup)

### Qualitatives
- [ ] Code review : approval équipe
- [ ] Documentation : compréhension nouveaux devs
- [ ] Maintenabilité : complexité cyclomatique divisée par 2

---

*Document créé le 2026-02-27*  
*Prochaine mise à jour : Fin Semaine 2 (Jalon 1)*
