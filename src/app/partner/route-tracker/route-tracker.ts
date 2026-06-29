import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RouteService } from '../../services/route.service';
import { MapService, getLeaflet } from '../../services/map.service';
import { MapConfigService } from '../../services/map-config.service';
import { point, lineString, pointToLineDistance } from '@turf/turf';

@Component({
  selector: 'app-route-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './route-tracker.html',
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
export class RouteTrackerComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  currentRoute: any = {
    id: 'TX-902',
    origin: 'Sector Alpha Industrial Node',
    destination: 'Coast Hub Base'
  };
  @Input() routesInput?: any[];
  @Input() currentRouteInput?: any;
  routes: any[] = [];
  routeUpdates: any[] = [];
  currentRoutePosition?: { lat: number; lng: number };
  routeDetourThresholdKm = 2;
  map: any = null;
  routePolylines: Map<string, any> = new Map();
  routeMarkers: Map<string, any[]> = new Map();
  selectedRouteId: string | null = null;
  private routeSub?: Subscription;
  private updateSub?: Subscription;

  constructor(
    private routeService: RouteService,
    private mapService: MapService,
    private mapConfig: MapConfigService
  ) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.mapConfig.setupDefaultIcon();

      if (this.routesInput && this.routesInput.length > 0) {
        this.routes = this.routesInput;
        this.currentRoute = this.currentRouteInput || this.routes[0];
        this.selectedRouteId = this.currentRoute?.id || null;
      } else {
        this.routeSub = this.routeService.routes$.subscribe(routes => {
          this.routes = routes;
          if (routes.length > 0) {
            this.currentRoute = routes[0];
            this.selectedRouteId = routes[0].id;
          }
          if (this.map) {
            this.renderAllRoutes();
          }
        });
      }

      this.updateSub = this.routeService.routeUpdates$.subscribe(updates => {
        this.routeUpdates = updates;
        this.currentRoutePosition = updates
          .filter(update => update.routeId === this.selectedRouteId)
          .map(update => ({ lat: update.latitude, lng: update.longitude }))
          .pop();
        if (this.map) {
          this.renderAllRoutes();
        }
      });
    }
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      this.initializeMap();
      if (this.routes.length > 0) {
        this.renderAllRoutes();
      }
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 0);
    }
  }

  // Friendly status labels for users
  statusLabel(status: string) {
    switch (status) {
      case 'in_transit': return 'In transit';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      default: return status ? status.replace(/_/g, ' ') : 'Unknown';
    }
  }

  initializeMap() {
    if (!this.map && this.mapContainer) {
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
      }).addTo(this.map);

      this.mapService.setLeafletMap(this.map);
    }
  }

  renderAllRoutes() {
    if (!this.map) return;

    // Clear existing polylines and markers
    this.routePolylines.forEach(polyline => {
      this.map?.removeLayer(polyline);
    });
    this.routeMarkers.forEach(markerArray => {
      markerArray.forEach(marker => {
        this.map?.removeLayer(marker);
      });
    });
    this.routePolylines.clear();
    this.routeMarkers.clear();

    // Render all routes
    this.routes.forEach(route => {
      this.renderRoute(route);
    });

    // Fit bounds to all routes
    this.fitMapToBounds();
  }

  renderRoute(route: any) {
    if (!this.map) return;

    const isSelected = route.id === this.selectedRouteId;
    const L = getLeaflet();
    if (!L) return;

    const markers: any[] = [];

    const originCoords: [number, number] = [22.5726, 88.3639];
    const destCoords: [number, number] = [22.5629, 88.3664];
    const baseline = lineString([[originCoords[1], originCoords[0]], [destCoords[1], destCoords[0]]]);
    const latestUpdate = this.routeUpdates
      .filter(update => update.routeId === route.id)
      .map(update => ({ lat: update.latitude, lng: update.longitude }))
      .pop();

    if (latestUpdate) {
      route.deviationKm = pointToLineDistance(
        point([latestUpdate.lng, latestUpdate.lat]),
        baseline,
        { units: 'kilometers' }
      );
    } else {
      route.deviationKm = 0;
    }

    const routeStatus = route.deviationKm > this.routeDetourThresholdKm ? 'detour' : 'on_course';
    const color = routeStatus === 'detour' ? '#f87171' : (isSelected ? '#06b6d4' : '#64748b');

    const originMarker = L.marker(originCoords, {
      icon: this.mapService.createColoredMarker('red'),
      title: route.origin
    })
      .bindPopup(`<strong>${route.origin}</strong>`)
      .addTo(this.map!);
    markers.push(originMarker);

    const destMarker = L.marker(destCoords, {
      icon: this.mapService.createColoredMarker('green'),
      title: route.destination
    })
      .bindPopup(`<strong>${route.destination}</strong>`)
      .addTo(this.map!);
    markers.push(destMarker);

    const path: [number, number][] = [originCoords];
    if (latestUpdate) {
      const updateMarker = L.marker([latestUpdate.lat, latestUpdate.lng], {
        icon: this.mapService.createColoredMarker('blue'),
        title: 'Current Truck Position'
      })
        .bindPopup(`<strong>Live Position</strong><br>Deviation: ${route.deviationKm.toFixed(2)} km`)
        .addTo(this.map!);
      markers.push(updateMarker);
      path.push([latestUpdate.lat, latestUpdate.lng]);
    }
    path.push(destCoords);

    if (route.waypoints && route.waypoints.length > 0) {
      route.waypoints.forEach((waypoint: any) => {
        const marker = L.marker([waypoint.latitude, waypoint.longitude], {
          icon: this.mapService.createColoredMarker('orange'),
          title: waypoint.name || 'Waypoint'
        })
          .bindPopup(`<strong>Waypoint</strong><br>${waypoint.name || 'Stop'}`)
          .addTo(this.map!);
        markers.push(marker);
        path.push([waypoint.latitude, waypoint.longitude]);
      });
    }

    const polyline = L.polyline(path, {
      color: color,
      weight: isSelected ? 4 : 2,
      opacity: isSelected ? 1 : 0.6,
      smoothFactor: 1.0
    })
      .on('click', () => this.selectRoute(route.id))
      .addTo(this.map!);

    this.routePolylines.set(route.id, polyline);
    this.routeMarkers.set(route.id, markers);
  }

  selectRoute(routeId: string) {
    this.selectedRouteId = routeId;
    const route = this.routes.find(r => r.id === routeId);
    if (route) {
      this.currentRoute = route;
      this.renderAllRoutes();
    }
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.updateSub?.unsubscribe();
  }

  fitMapToBounds() {
    if (!this.map || this.routes.length === 0) return;

    const allCoords: [number, number][] = [];
    this.routes.forEach(route => {
      const origin: [number, number] = [22.5726, 88.3639];
      const dest: [number, number] = [22.5629, 88.3664];
      allCoords.push(origin);
      allCoords.push(dest);
      const latestUpdate = this.routeUpdates.filter(update => update.routeId === route.id).pop();
      if (latestUpdate) {
        allCoords.push([latestUpdate.latitude, latestUpdate.longitude]);
      }
    });

    if (allCoords.length > 0) {
      const L = getLeaflet();
      if (!L) return;

      const bounds = L.latLngBounds(allCoords);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}