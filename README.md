# KONOHA MVP - RadarScout

Visualiseur de statistiques radar pour joueurs professionnels de League of Legends.

## 🎯 Features

- **Import CSV** : Glissez-déposez vos fichiers CSV de stats
- **Radar Chart** : Visualisation interactive avec Chart.js
- **3 Modes** : Solo, Comparaison (2 joueurs), Benchmark (vs moyenne)
- **Grades S/A/B/C/D** : Système de notation automatique
- **Export PNG** : Export haute résolution (1200×800)
- **Persistant** : Données sauvegardées dans localStorage

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📁 Structure

```
src/
├── core/              # Core HUB (PluginRegistry, StateManager, etc.)
│   ├── KonohaCore.ts
│   ├── PluginRegistry.ts
│   ├── AppStateManager.ts
│   ├── MetricRegistry.ts
│   ├── EventBus.ts
│   ├── ThemeService.ts
│   ├── DataService.ts
│   ├── StorageService.ts
│   ├── NormalizationService.ts
│   ├── ExportService.ts
│   └── types.ts       # Interfaces TypeScript
├── modules/
│   └── radar-scout/   # Module RadarScout
│       ├── index.ts   # Entry point (Plugin)
│       ├── RadarScoutModule.ts
│       ├── components/
│       ├── services/
│       └── config/
└── styles/            # CSS Tokens & Styles
```

## 📊 Format CSV

Le fichier CSV doit contenir les colonnes suivantes :
- `Player` ou `Name` - Nom du joueur
- `Team` - Équipe
- `Pos` ou `Position` ou `Role` - Rôle (TOP, JUNGLE, MID, ADC, SUPPORT)
- Métriques numériques (KDA, KP%, DMG%, etc.)

Exemple :
```csv
Player,Team,KDA,KP%,DMG%,CSD@15,CSPM
Faker,T1,4.5,65,28,12.5,8.5
Chovy,GEN,5.2,68,26,15.8,9.2
```

## 🏗️ Architecture

- **Plugin Pattern** : Modules chargeables dynamiquement
- **CoreAPI** : Interface stable entre Core et modules
- **Observable State** : Réactivité sans framework
- **Glassmorphism UI** : Design premium sombre

## 📦 Tech Stack

- Vite + TypeScript (strict)
- Chart.js 4.x (radar charts)
- PapaParse (CSV parsing)
- html2canvas (PNG export)

---

*KONOHA MVP - Version 1.0*
