# KONOHA MVP - Radar Scout V4

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://konoha-mvp.vercel.app)
[![Tests](https://img.shields.io/badge/tests-65%20passed-brightgreen)](./src/test)
[![BMAD](https://img.shields.io/badge/BMAD-100%25-blue)](./_bmad-output)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-purple)](https://vitejs.dev/)

Visualiseur de statistiques radar pour joueurs professionnels de League of Legends.

🔗 **Live Demo:** https://konoha-mvp.vercel.app

---

## ✨ Features

### 📊 Visualisation Radar
- **Mode Solo** : Affiche les statistiques d'un joueur
- **Mode Comparison** : Compare 2 joueurs côte à côte
- **Mode Benchmark** : Compare vs moyenne du rôle
- **Points colorés** selon leur tier (S/A/B/C)

### 📈 Percentile Analysis
- **3 catégories** : Fight / Vision / Resources
- **Noms complets** des métriques
- **Barres colorées** par percentile
- **Import CSV** intégré

### 🏆 Leaderboard
- **Classement par rôle** (Top 10)
- **Grades S/A/B/C** avec badges colorés
- **Podium** 🥇🥈🥉 pour top 3

### 🎨 Thèmes
- **Couleurs par rôle** : TOP (rouge), JGL (vert), MID (bleu), ADC (jaune), SUP (violet)
- **Glow dynamique** au hover
- **Glassmorphism** design

### 📤 Export
- **Solo** : 1200×800px
- **Social** : 1080×1080px (carré)
- **PNG** haute qualité

### 💾 Cache
- **localStorage** persistence
- **Chargement auto** au démarrage

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm ou yarn

### Installation

```bash
# Cloner le repo
git clone <repo-url>
cd KONOHA-MVP

# Installer les dépendances
npm install

# Lancer le dev server
npm run dev

# Build pour production
npm run build

# Lancer les tests
npm test

# Tests avec coverage
npm run test:coverage
```

---

## 🏗️ Architecture

### Stack Technique
- **Framework** : Vite + TypeScript
- **Charts** : Chart.js 4.x
- **Parsing CSV** : PapaParse
- **Export** : html2canvas
- **Tests** : Vitest + jsdom
- **Hébergement** : Vercel

### Structure du Projet

```
src/
├── core/                          # Couche Core (Singleton)
│   ├── KonohaCore.ts             # Orchestrateur principal
│   ├── AppStateManager.ts        # State management réactif
│   ├── NormalizationService.ts   # Normalisation 0-100
│   ├── DataService.ts            # Parsing CSV
│   ├── ExportService.ts          # Export PNG
│   └── types.ts                  # Toutes les interfaces
│
├── modules/
│   └── radar-scout/              # Module UI
│       ├── RadarScoutModuleV4.ts # Composant principal
│       ├── components/
│       │   └── RadarChart.ts     # Wrapper Chart.js
│       ├── services/
│       │   ├── RadarDataService.ts
│       │   └── GradeCalculator.ts
│       └── config/
│           └── roleMetrics.ts    # Config par rôle
│
├── test/                         # Tests unitaires
│   ├── NormalizationService.test.ts
│   ├── RadarDataService.test.ts
│   └── GradeCalculator.test.ts
│
└── styles/                       # CSS avec variables
    ├── tokens.css
    └── radar-v4.css
```

### Patterns Utilisés
- **Singleton** : KonohaCore
- **Observer** : AppStateManager (subscriptions)
- **Factory** : RadarDataService
- **Strategy** : Grade calculation

---

## 📚 Documentation BMAD

Ce projet suit la méthodologie **BMAD** (Brainstorming, Mapping, Architecture, Development).

```
_bmad-output/
├── phase1-brainstorming/
│   └── 01-user-stories.md          # User stories détaillées
├── phase2-mapping/
│   └── 01-data-flow.md             # Flux de données
├── phase3-architecture/
│   └── 01-component-architecture.md # Design patterns
└── phase4-development/
    └── 01-implementation-checklist.md # Statut implémentation
```

**Score BMAD : 100%** ✅

---

## 🧪 Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Coverage
| Service | Tests | Status |
|---------|-------|--------|
| NormalizationService | 23 | ✅ |
| RadarDataService | 14 | ✅ |
| GradeCalculator | 15 | ✅ |
| Core (existing) | 13 | ✅ |
| **Total** | **65** | **✅** |

---

## 🎯 Système de Grades

| Grade | Range | Label | Couleur |
|-------|-------|-------|---------|
| S | 90-100 | Elite | #00D9C0 |
| A | 80-89 | Excellent | #4ADE80 |
| B | 60-79 | Good | #FACC15 |
| C | <60 | Weak | #EF4444 |

---

## 🎨 Couleurs par Rôle

| Rôle | Couleur | Hex |
|------|---------|-----|
| TOP | Rouge | #FF5757 |
| JUNGLE | Vert | #4ADE80 |
| MID | Bleu | #60A5FA |
| ADC | Jaune | #FACC15 |
| SUPPORT | Violet | #C084FC |

---

## 📦 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Configuration
Le projet est configuré avec `vercel.json` pour le déploiement static.

---

## 📝 Changelog

### v1.0.0 (2026-02-25)
- ✅ Visualisation radar (solo/compare/benchmark)
- ✅ Percentile Analysis (Fight/Vision/Resources)
- ✅ Leaderboard avec grades S/A/B/C
- ✅ Export Solo/Social
- ✅ Thèmes par rôle avec glow
- ✅ Cache localStorage
- ✅ 65 tests unitaires
- ✅ Documentation BMAD complète

---

## 🤝 Contributing

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

---

## 📄 License

MIT License - voir [LICENSE](./LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- Données : Oracle's Elixir / LCK Cup 2026
- Design inspiration : League of Legends
- Méthodologie : BMAD v6.0.3

---

<p align="center">
  <strong>KONOHA</strong> - League Scout Analysis
  <br>
  Made with ❤️ for the League of Legends community
</p>
