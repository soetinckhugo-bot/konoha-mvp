/**
 * KONOHA - Application Entry Point
 * MVP RadarScout
 */

import { KonohaCore } from './core';
import RadarScoutPlugin from './modules/radar-scout';
import './styles/tokens.css';
import './styles/main.css';
import './styles/radar-scout.css';

// Initialize KONOHA Core
const core = KonohaCore.getInstance();

// Register RadarScout plugin
const radarPlugin = new RadarScoutPlugin();
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
  
  // Check if we have data
  const players = core.api.getState('players');
  if (players.length > 0) {
    // Mount the plugin
    await radarPlugin.mount(core.api);
  } else {
    // Show welcome screen
    showWelcomeScreen();
  }
};

function setupFileUpload(): void {
  const uploadZone = document.getElementById('upload-zone') as HTMLElement;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  
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
    await core.importCSV(file);
    
    const players = core.api.getState('players');
    
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
      // Mount plugin
      await radarPlugin.mount(core.api);
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
