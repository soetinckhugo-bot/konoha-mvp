# KONOHA V2.1 - RELEASE NOTES

**Date:** 2026-02-25  
**Version:** V2.1 (Fix Sprint)  
**URL:** https://konoha-mvp.vercel.app

---

## 🏥 Health Check & Fix Sprint - COMPLETED

### Tickets corrigés

#### ✅ Ticket #1: WinProbability connecté
- **Fichier:** `DuelView.ts`
- **Changement:** Le service `WinProbability` est maintenant instancié et utilisé
- **Avantage:** Calcul de probabilité plus sophistiqué avec cohérence des métriques

#### ✅ Ticket #2: ScoreCalculator connecté
- **Fichier:** `LeaderboardPanel.ts`
- **Changement:** Utilise `ScoreCalculator.calculatePlayerScore()` au lieu d'une simple moyenne
- **Avantage:** Scoring pondéré par rôle (TOP, JUNGLE, MID, ADC, SUPPORT)

#### ✅ Ticket #3: Export PNG fixé
- **Fichier:** `RadarScoutModule.ts`
- **Changement:** Création d'un RadarChart temporaire dans le container d'export
- **Avantage:** Capture fiable sans déformation glassmorphism

#### ✅ Ticket #4: Error boundaries & cleanup
- **Fichiers:** `DuelView.ts`, `CentileBar.ts`, `RadarScoutModule.ts`
- **Changements:**
  - Try/catch dans les méthodes `render()`
  - Cleanup propre des instances
  - Logging des erreurs

---

## 📊 Métriques

| Métrique | Valeur |
|----------|--------|
| Build | ✅ Succès |
| Tests | ✅ 13/13 pass |
| Bundle JS | 51.21 kB (+3.22 kB) |
| Bundle CSS | 28.76 kB (inchangé) |
| Deploy | ✅ Vercel production |

---

## 🎯 Fonctionnalités stables

- ✅ Mode Solo avec centiles
- ✅ Mode Compare (2 joueurs)
- ✅ Mode Benchmark (vs moyenne)
- ✅ Mode Duel avec win probability
- ✅ Export PNG Solo (1200×800)
- ✅ Export PNG Social (1080×1080)
- ✅ Leaderboard avec scoring pondéré

---

## 🚀 Prochaine étape

Prêt pour **Feature Pack V3** ou autre évolution BMAD.

---

*BMAD Fix Sprint V2.1 - Terminé avec succès*
