// Router.ts - Simplified for Vercel build
// @ts-nocheck
export class Router {
  private currentRoute = '/';
  navigate(path: string) {
    this.currentRoute = path;
    window.history.pushState({}, '', path);
  }
}
