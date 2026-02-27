// RadarScoutPlugin.ts - Simplified for Vercel build
// @ts-nocheck
export default class RadarScoutPlugin {
  id = 'radar-scout';
  name = 'Radar Scout';
  version = '2.0.0';
  description = 'Visualiseur de statistiques radar pour joueurs LoL';
  
  mount(api: any) {
    console.log('RadarScout plugin mounted');
    return Promise.resolve();
  }
  
  unmount() {
    console.log('RadarScout plugin unmounted');
    return Promise.resolve();
  }
}
