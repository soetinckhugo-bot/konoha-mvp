# PlayerSelectModule - Documentation BMAD

**Module** : Sélection de joueur  
**Type** : Module UI BMAD  
**Semaine** : 5  
**Statut** : ✅ Implémenté & Testé

---

## Vue d'ensemble

PlayerSelectModule est le premier **module UI BMAD** découplé de SoloModule. Il gère l'affichage et l'interaction du dropdown de sélection de joueur.

```
┌─────────────────────────────────────────────────────────────┐
│                   PlayerSelectModule                        │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  [Joueur ▼]                                         │   │
│   │   ├─ Chovy (GEN)                                    │   │
│   │   ├─ Faker (T1)    ← Sélectionné                    │   │
│   │   ├─ Gumayusi (T1)                                  │   │
│   │   └─ Zeus (T1)                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Responsabilités :                                         │
│   • Afficher la liste des joueurs filtrés par rôle          │
│   • Émettre l'événement player:selected                     │
│   • Synchroniser avec le Store                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture BMAD

### Implémentation IBaseModule

```typescript
class PlayerSelectModule implements IBaseModule {
  readonly id = 'player-select';
  
  constructor(
    private playerFilterService: PlayerFilterService,  // Injection
    config?: PlayerSelectConfig
  ) {}
  
  render(context: IModuleContext): void {   // Montage DOM
  update(context: IModuleContext): void {   // MAJ optimisée
  destroy(): void {                         // Cleanup
}
```

### Cycle de vie

```
render()
    │
    ▼
┌─────────────────────────────────────┐
│  1. Crée container                  │
│  2. Crée <select>                   │
│  3. Popule options (filtré/trié)    │
│  4. Attache event listeners         │
│  5. Subscribe Store (currentRole)   │
└─────────────────────────────────────┘
    │
    ▼
update() ← Optimisé, ne recrée pas le DOM
    │
    ▼
destroy()
    │
    ▼
┌─────────────────────────────────────┐
│  1. Unsubscribe Store               │
│  2. Remove DOM                      │
│  3. Clear références                │
└─────────────────────────────────────┘
```

---

## Dépendances

### Services injectés

| Service | Usage | Mockable |
|---------|-------|----------|
| `PlayerFilterService` | Filtrage/tri des joueurs | ✅ Oui |

### Store subscriptions

| Clé | Action |
|-----|--------|
| `currentRole` | Re-render quand le rôle change |
| `players` | Re-render quand les données changent |
| `selectedPlayer` | Écriture quand sélection change |

---

## API Publique

### Constructeur

```typescript
new PlayerSelectModule(
  playerFilterService: PlayerFilterService,
  config?: {
    showTeam?: boolean;      // Affiche l'équipe (défaut: true)
    showRole?: boolean;      // Affiche le rôle (défaut: false)
    placeholder?: string;    // Texte option vide (défaut: "Sélectionner...")
    allowClear?: boolean;    // Permet désélection (défaut: true)
  }
)
```

### Méthodes

| Méthode | Description |
|---------|-------------|
| `render(context)` | Montage initial dans le DOM |
| `update(context)` | Mise à jour optimisée |
| `destroy()` | Destruction propre |
| `selectPlayer(id)` | Sélection programmatique |
| `getSelectedPlayer()` | Récupère le joueur sélectionné |
| `setConfig(config)` | MAJ configuration + re-render |

### Événements

| Événement | Détail | Description |
|-----------|--------|-------------|
| `bmad:player:selected` | `{ player, moduleId }` | Émis quand sélection change |

---

## Tests

**Fichier** : `src/modules/radar-scout/modules/__tests__/PlayerSelectModule.test.ts`  
**Tests** : 24 cas

### Couverture

| Catégorie | Tests |
|-----------|-------|
| Initialisation | 3 |
| Render | 7 |
| Filtrage par rôle | 2 |
| Interaction (change) | 3 |
| API Publique | 4 |
| Update | 2 |
| Destroy | 3 |
| Edge Cases | 4 |

### Exemple de test

```typescript
it('should update store when player selected', () => {
  module.render(context);
  
  const select = container.querySelector('.player-select-dropdown');
  select.value = mockPlayers[1].id;
  select.dispatchEvent(new Event('change'));
  
  expect(store.getState('selectedPlayer')).toEqual(mockPlayers[1]);
});
```

---

## Intégration Router

### Enregistrement

```typescript
// registerModules.ts
import { Router } from '../../../core/Router';
import { PlayerSelectModule } from '../modules/PlayerSelectModule';

Router.register(
  'player-select',                              // Mode
  new PlayerSelectModule(playerFilterService),  // Instance
  { flag: 'playerSelectModule' }                // Feature flag
);
```

### Feature Flag

```typescript
// Activation du module BMAD
FeatureFlagService.enable('playerSelectModule');

// Fallback vers V4 si disabled
FeatureFlagService.disable('playerSelectModule');
```

---

## Comparaison V4 vs BMAD

### Avant (V4 monolithique)

```typescript
// Dans RadarScoutModuleV4.ts (lignes ~450-500)
private createPlayerSelect(): HTMLSelectElement {
  const select = document.createElement('select');
  select.id = 'player-select';
  
  // Filtrage inline
  const filtered = this.currentRole === 'ALL' 
    ? this.players 
    : this.players.filter(p => p.role === this.currentRole);
  
  // Création options inline
  filtered.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.team})`;
    select.appendChild(opt);
  });
  
  // Event handler inline
  select.addEventListener('change', () => {
    this.selectedPlayer = this.players.find(p => p.id === select.value);
    this.updateView();
  });
  
  return select;
}
```

### Après (BMAD module)

```typescript
// PlayerSelectModule.ts
class PlayerSelectModule implements IBaseModule {
  constructor(
    private playerFilterService: PlayerFilterService  // Injection
  ) {}
  
  render(context: IModuleContext): void {
    // Utilise le service pour filtrer
    const filtered = this.playerFilterService.filterByRole(
      context.store.getState('players'),
      context.store.getState('currentRole')
    );
    
    // Rendu DOM pur
    // Event -> Store (pas de méthode privée)
  }
}
```

### Bénéfices

| Aspect | V4 | BMAD |
|--------|-----|------|
| Testabilité | ❌ Difficile (dépendances cachées) | ✅ Facile (injection) |
| Réutilisabilité | ❌ Couplé au monolithe | ✅ Module autonome |
| Maintenance | ❌ Code dispersé | ✅ Responsabilité unique |
| Render optimisé | ❌ Recrée tout | ✅ Update sélective |

---

## Utilisation

### Dans SoloModule

```typescript
class SoloModule implements IBaseModule {
  private playerSelect: PlayerSelectModule;
  
  constructor() {
    this.playerSelect = new PlayerSelectModule(
      new PlayerFilterService(),
      { showTeam: true }
    );
  }
  
  render(context: IModuleContext): void {
    // Layout
    const sidebar = document.createElement('div');
    
    // Intègre PlayerSelectModule
    this.playerSelect.render({
      ...context,
      container: sidebar
    });
    
    // Continue avec autres composants...
  }
}
```

---

## Roadmap

- [x] Implémentation BMAD
- [x] Tests unitaires
- [x] Intégration Router
- [ ] CSS theming (konoha variables)
- [ ] Animations transitions
- [ ] Recherche type-ahead

---

**Module BMAD** : PlayerSelectModule ✅  
**Tests** : 24/24  
**Intégration** : Router + FeatureFlag ✅
