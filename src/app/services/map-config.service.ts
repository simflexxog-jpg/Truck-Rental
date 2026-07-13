import { Injectable } from '@angular/core';

// Lazy-load Leaflet only on the browser to avoid SSR issues (window undefined)
let L: any;
function getLeaflet() {
  if (typeof window !== 'undefined' && !L) {
    if ((window as any).L) {
      L = (window as any).L;
    } else {
      // Use require inside a browser guard so server build doesn't evaluate Leaflet
      // which references `window` during module initialization.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      L = require('leaflet');
    }
  }
  return L;
}

@Injectable({
  providedIn: 'root'
})
export class MapConfigService {
  // Default map settings with fallback tile layers
  private mapSettings = {
    zoom: 12,
    center: { lat: 22.5726, lng: 88.3639 }, // Kolkata, India
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  };

  // Set up default Leaflet icon (important for marker display)
  setupDefaultIcon() {
    const leaflet = getLeaflet();
    if (!leaflet) return;

    delete (leaflet.Icon.Default.prototype as any)._getIconUrl;

    leaflet.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }

  getMapSettings() {
    return this.mapSettings;
  }

  updateMapSettings(settings: Partial<typeof this.mapSettings>) {
    this.mapSettings = { ...this.mapSettings, ...settings };
  }
}
