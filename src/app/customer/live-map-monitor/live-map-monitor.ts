import { Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteService } from '../../services/route.service';
import { MapService, getLeaflet } from '../../services/map.service';
import { MapConfigService } from '../../services/map-config.service';

@Component({
  selector: 'app-live-map-monitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-map-monitor.html',
  styles: [`
    #map-container {
      width: 100%;
      height: 100%;
      border-radius: 0.75rem;
      overflow: hidden;
    }
    
    .leaflet-container {
      border-radius: 0.75rem;
    }
  `]
})
export class LiveMapMonitorComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  // Accept dynamic values from parent components
  @Input() originNode?: string;
  @Input() destinationNode?: string;
  @Input() initialLocation?: { lat: number; lng: number };

  routeUpdates: any[] = [];
  currentLocation = { lat: 22.5726, lng: 88.3639 };
  originLocation = { lat: 22.5726, lng: 88.3639 };
  destinationLocation = { lat: 22.5629, lng: 88.3664 };
  map: any = null;
  routePolyline: any = null;
  markers: Map<string, any> = new Map();

  constructor(
    private routeService: RouteService,
    private mapService: MapService,
    private mapConfig: MapConfigService
  ) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.mapConfig.setupDefaultIcon();
      this.routeService.routeUpdates$.subscribe(updates => {
        this.routeUpdates = updates;
        if (updates.length > 0) {
          const latest = updates[updates.length - 1];
          this.currentLocation = { lat: latest.latitude, lng: latest.longitude };
          this.updateCurrentLocationMarker();
          
          if (this.routeUpdates.length > 1) {
            this.updateRoutePolyline();
          }
        }
      });
    }
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      if (!this.originNode) this.originNode = 'Barasat Terminal Vector';
      if (!this.destinationNode) this.destinationNode = 'Salt Lake Sector V Hub';
      if (this.initialLocation) this.currentLocation = this.initialLocation;
      this.initializeMap();
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 0);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['originNode'] || changes['destinationNode']) && this.map) {
      this.updateAddressMarkers();
    }
  }

  initializeMap() {
    if (!this.map && this.mapContainer && typeof window !== 'undefined') {
      const L = getLeaflet();
      if (!L) return;

      const settings = this.mapConfig.getMapSettings();

      this.map = L.map(this.mapContainer.nativeElement).setView(
        [settings.center.lat, settings.center.lng],
        settings.zoom
      );

      // Add tile layer
      L.tileLayer(settings.tileLayer, {
        attribution: settings.attribution,
        maxZoom: 19
      }).addTo(this.map!);

      this.map.invalidateSize();

      // Resolve and add origin/destination markers
      this.resolveAddressesAndRenderMarkers();
      this.updateCurrentLocationMarker();

      this.mapService.setLeafletMap(this.map);
    }
  }

  private updateAddressMarkers() {
    if (!this.map) return;
    this.resolveAddressesAndRenderMarkers();
  }

  private async resolveAddressesAndRenderMarkers() {
    const originCoords = await this.geocodeAddress(this.originNode || 'Barasat Terminal Vector');
    const destinationCoords = await this.geocodeAddress(this.destinationNode || 'Salt Lake Sector V Hub');
    const L = getLeaflet();
    if (!this.map || !L) return;

    this.originLocation = originCoords || this.originLocation;
    this.destinationLocation = destinationCoords || this.destinationLocation;

    // Clear existing origin/destination markers and polyline
    if (this.markers.has('origin')) {
      this.map.removeLayer(this.markers.get('origin'));
      this.markers.delete('origin');
    }
    if (this.markers.has('destination')) {
      this.map.removeLayer(this.markers.get('destination'));
      this.markers.delete('destination');
    }
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }

    // Add origin marker
    const originMarker = L.marker([this.originLocation.lat, this.originLocation.lng], {
      icon: this.mapService.createColoredMarker('red'),
      title: this.originNode
    })
      .bindPopup(`<strong>Origin</strong><br>${this.originNode}`)
      .addTo(this.map!);
    this.markers.set('origin', originMarker);

    // Add destination marker
    const destinationMarker = L.marker([this.destinationLocation.lat, this.destinationLocation.lng], {
      icon: this.mapService.createColoredMarker('green'),
      title: this.destinationNode
    })
      .bindPopup(`<strong>Destination</strong><br>${this.destinationNode}`)
      .addTo(this.map!);
    this.markers.set('destination', destinationMarker);

    // Draw route line
    this.routePolyline = L.polyline([
      [this.originLocation.lat, this.originLocation.lng],
      [this.destinationLocation.lat, this.destinationLocation.lng]
    ], {
      color: '#22d3ee',
      weight: 4,
      opacity: 0.75,
      smoothFactor: 1.0
    }).addTo(this.map!);

    const bounds = L.latLngBounds([
      [this.originLocation.lat, this.originLocation.lng],
      [this.destinationLocation.lat, this.destinationLocation.lng]
    ]);
    if (this.map && bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.2));
    }
  }

  private async geocodeAddress(address?: string): Promise<{ lat: number; lng: number }> {
    const query = encodeURIComponent(address || 'Kolkata');
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        return {
          lat: Number(results[0].lat),
          lng: Number(results[0].lon)
        };
      }
    } catch (error) {
      console.warn('Geocoding failed for', address, error);
    }

    return { lat: 22.5726, lng: 88.3639 };
  }

  updateCurrentLocationMarker() {
    const L = getLeaflet();
    if (!this.map || !L) return;

    // Remove old marker
    if (this.markers.has('current')) {
      this.map!.removeLayer(this.markers.get('current')!);
    }

    // Add new marker
    const marker = L.marker([this.currentLocation.lat, this.currentLocation.lng], {
      icon: this.mapService.createColoredMarker('blue'),
      title: 'Current Truck Location'
    })
      .bindPopup(
        `<strong>Current Location</strong><br>
        Lat: ${this.currentLocation.lat.toFixed(4)}<br>
        Lng: ${this.currentLocation.lng.toFixed(4)}`
      )
      .addTo(this.map!);

    this.markers.set('current', marker);

    // Center map on current location
    this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 14);
  }

  updateRoutePolyline() {
    const L = getLeaflet();
    if (!this.map || !L) return;

    // Remove old polyline
    if (this.routePolyline) {
      this.map!.removeLayer(this.routePolyline);
    }

    // Create new polyline from route updates
    const path = this.routeUpdates.map(update => [
      update.latitude,
      update.longitude
    ] as [number, number]);

    this.routePolyline = L.polyline(path, {
      color: '#22d3ee',
      weight: 3,
      opacity: 0.7,
      smoothFactor: 1.0
    }).addTo(this.map!);
  }
}