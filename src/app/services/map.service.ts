import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Lazy-load Leaflet in browser only to avoid SSR `window is not defined` errors
let L: any;
export function getLeaflet() {
  if (typeof window !== 'undefined' && !L) {
    if ((window as any).L) {
      L = (window as any).L;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      L = require('leaflet');
    }
  }
  return L;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  infoWindow?: string;
  // Leaflet types are loaded at runtime; use `any` to avoid SSR type errors
  icon?: any;
  color?: string;
}

export interface MapRoute {
  id: string;
  path: { lat: number; lng: number }[];
  color?: string;
  strokeWeight?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private defaultCenter = { lat: 22.5726, lng: 88.3639 }; // Kolkata, India
  private defaultZoom = 12;

  private markers$ = new BehaviorSubject<MapMarker[]>([]);
  private routes$ = new BehaviorSubject<MapRoute[]>([]);
  private mapCenter$ = new BehaviorSubject<{ lat: number; lng: number }>(this.defaultCenter);
  private mapZoom$ = new BehaviorSubject<number>(this.defaultZoom);
  private leafletMap: any = null;

  getMarkers() {
    return this.markers$.asObservable();
  }

  getRoutes() {
    return this.routes$.asObservable();
  }

  getMapCenter() {
    return this.mapCenter$.asObservable();
  }

  getMapZoom() {
    return this.mapZoom$.asObservable();
  }

  setLeafletMap(map: any) {
    this.leafletMap = map;
  }

  addMarker(marker: MapMarker) {
    const currentMarkers = this.markers$.value;
    this.markers$.next([...currentMarkers, marker]);
  }

  removeMarker(markerId: string) {
    const currentMarkers = this.markers$.value.filter(m => m.id !== markerId);
    this.markers$.next(currentMarkers);
  }

  updateMarker(marker: MapMarker) {
    const currentMarkers = this.markers$.value.map(m => m.id === marker.id ? marker : m);
    this.markers$.next(currentMarkers);
  }

  clearMarkers() {
    this.markers$.next([]);
  }

  addRoute(route: MapRoute) {
    const currentRoutes = this.routes$.value;
    this.routes$.next([...currentRoutes, route]);
  }

  removeRoute(routeId: string) {
    const currentRoutes = this.routes$.value.filter(r => r.id !== routeId);
    this.routes$.next(currentRoutes);
  }

  clearRoutes() {
    this.routes$.next([]);
  }

  setMapCenter(center: { lat: number; lng: number }) {
    this.mapCenter$.next(center);
    if (this.leafletMap) {
      this.leafletMap.setView([center.lat, center.lng]);
    }
  }

  setMapZoom(zoom: number) {
    this.mapZoom$.next(zoom);
    if (this.leafletMap) {
      this.leafletMap.setZoom(zoom);
    }
  }

  // Utility function to calculate bounds for multiple points
  calculateBounds(points: { lat: number; lng: number }[]) {
    if (points.length === 0) return null;

    const leaflet = getLeaflet();
    if (!leaflet) return null;

    const latlngs = points.map(p => [p.lat, p.lng] as [number, number]);
    const bounds = leaflet.latLngBounds(latlngs);
    return bounds;
  }

  // Create a colored marker
  createColoredMarker(color: string) {
    const leaflet = getLeaflet();
    if (!leaflet) return null;

    return leaflet.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }
}
