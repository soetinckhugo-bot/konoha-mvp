/**
 * KONOHA - Application Entry Point
 * MVP RadarScout
 */

import { KonohaCore } from './core';
import type { Player } from './core/types';
import RadarScoutPlugin from './modules/radar-scout';
import './styles/tokens.css';
import './styles/main.css';
import './styles/radar-scout.css';
import './styles/radar-v4.css';

// Initialize KONOHA Core
const core = KonohaCore.getInstance();

// Register RadarScout plugin
const radarPlugin = new RadarScoutPlugin();
let isPluginMounted = false; // 🔧 FIX: Track mount state

core.registerPlugin({
  id: radarPlugin.id,
  name: radarPlugin.name,
  version: radarPlugin.version,
  description: 'Visualiseur de statistiques radar pour joueurs LoL',
  entryPoint: './modules/radar-scout/index.ts',
  dependencies: []
});

// Mount RadarScout plugin manually (since we're not doing dynamic import)
const mountPlugin = async () => {
  await core.initialize();
  
  // Setup file upload
  setupFileUpload();
  
  // Try to load cached data (await pour le auto-mount)
  await loadCachedData();
  
  // Check if we have data (from cache or fresh)
  const players = core.api.getState('players');
  if (players.length > 0) {
    // 🔧 FIX: Only mount if not already mounted
    if (!isPluginMounted) {
      await radarPlugin.mount(core.api);
      isPluginMounted = true;
    }
  } else {
    // Show welcome screen
    showWelcomeScreen();
  }
};

async function loadCachedData(): Promise<void> {
  try {
    // Utiliser l'API publique pour charger les données
    const cachedPlayers = core.api.data.load('konoha_players') as Player[] | null;
    if (cachedPlayers && cachedPlayers.length > 0) {
      core.api.setState('players', cachedPlayers);
      
      // Recalculate ranges and centiles via l'API publique
      const ranges = core.api.normalize.calculateRanges(cachedPlayers);
      core.api.normalize.calculateCentiles(cachedPlayers);
      
      core.api.setState('metricRanges', ranges);
      
      console.log(`✅ Loaded ${cachedPlayers.length} players from cache`);
      
      // Update header badges
      updateHeaderBadges(cachedPlayers.length, true);
      
      // Auto-mount plugin if data exists
      if (!isPluginMounted) {
        const welcomeScreen = document.getElementById('welcome-screen');
        const appContainer = document.getElementById('app-container');
        
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
        
        await radarPlugin.mount(core.api);
        isPluginMounted = true;
      }
    }
  } catch (err) {
    console.warn('Failed to load cached data:', err);
  }
}

function updateHeaderBadges(count: number, fromCache: boolean = false): void {
  const countBadge = document.getElementById('players-count');
  const cacheBadge = document.getElementById('cache-badge');
  const cacheInfo = document.getElementById('cache-info');
  
  if (countBadge) {
    countBadge.textContent = `${count} Players loaded`;
  }
  
  if (fromCache && cacheBadge && cacheInfo) {
    cacheBadge.style.display = 'flex';
    const lastImport = localStorage.getItem('konoha_last_import');
    if (lastImport) {
      const date = new Date(parseInt(lastImport, 10));
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
      cacheInfo.textContent = `${count} players (cache ${diffMinutes}m)`;
    }
  }
}

function setupFileUpload(): void {
  const uploadZone = document.getElementById('upload-zone') as HTMLElement;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const importBtn = document.getElementById('import-btn');
  
  // Header import button
  importBtn?.addEventListener('click', () => {
    // If we're in the app, create a temporary file input
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.accept = '.csv';
    tempInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) await handleFile(file);
    };
    tempInput.click();
  });
  
  if (!uploadZone || !fileInput) return;

  // Click to select
  uploadZone.addEventListener('click', () => fileInput.click());

  // File selected
  fileInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) await handleFile(file);
  });

  // Drag & drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file) await handleFile(file);
  });
}

async function handleFile(file: File): Promise<void> {
  const uploadStatus = document.getElementById('upload-status');
  
  // Validation
  if (!file.name.endsWith('.csv')) {
    showUploadError('Veuillez sélectionner un fichier CSV');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showUploadError('Fichier trop volumineux (max 10MB)');
    return;
  }

  // Show loading
  if (uploadStatus) {
    uploadStatus.innerHTML = `
      <div class="upload-loading">
        <div class="spinner"></div>
        <span>Analyse du fichier...</span>
      </div>
    `;
  }

  try {
    await core.api.importCSV(file);
    
    const players = core.api.getState('players');
    
    // Update header badges
    updateHeaderBadges(players.length, false);
    
    if (uploadStatus) {
      uploadStatus.innerHTML = `
        <div class="upload-success">
          ✅ ${players.length} joueurs importés avec succès
        </div>
      `;
    }

    // Hide welcome, show app
    const welcomeScreen = document.getElementById('welcome-screen');
    const appContainer = document.getElementById('app-container');
    
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (appContainer) {
      appContainer.style.display = 'block';
      // 🔧 FIX: Only mount if not already mounted
      if (!isPluginMounted) {
        await radarPlugin.mount(core.api);
        isPluginMounted = true;
      }
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur d\'import';
    showUploadError(message);
  }
}

function showUploadError(message: string): void {
  const uploadStatus = document.getElementById('upload-status');
  if (uploadStatus) {
    uploadStatus.innerHTML = `<div class="upload-error">❌ ${message}</div>`;
  }
}

function showWelcomeScreen(): void {
  const welcomeScreen = document.getElementById('welcome-screen');
  const appContainer = document.getElementById('app-container');
  
  if (welcomeScreen) welcomeScreen.style.display = 'flex';
  if (appContainer) appContainer.style.display = 'none';
}

// Start application
mountPlugin().catch(err => {
  console.error('Failed to initialize KONOHA:', err);
});

// Expose core for debugging (dev only)
if (true) { // Dev mode check disabled for now
  (window as unknown as Record<string, unknown>).konoha = core;
}
