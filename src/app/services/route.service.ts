import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface RouteUpdate {
  id: string;
  routeId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  status: 'in-transit' | 'delivered' | 'delayed';
}

export interface AddOnJob {
  title: string;
  weight: number;
  dimensions: string;
  pickupDetour: number;
  dropoffDetour: number;
  currentCeiling: number;
}

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private routes = new BehaviorSubject<any[]>(this.loadRoutesFromStorage());
  public routes$ = this.routes.asObservable();

  private routeUpdates = new BehaviorSubject<RouteUpdate[]>([]);
  public routeUpdates$ = this.routeUpdates.asObservable();

  private addOnJobs = new BehaviorSubject<AddOnJob[]>([
    {
      title: 'Express Electronics Transport',
      weight: 150,
      dimensions: '2m x 1.5m x 1m',
      pickupDetour: 8.5,
      dropoffDetour: 3.2,
      currentCeiling: 1850.00
    },
    {
      title: 'Perishable Goods Quick Haul',
      weight: 200,
      dimensions: '3m x 2m x 2.5m',
      pickupDetour: 5.0,
      dropoffDetour: 7.8,
      currentCeiling: 2250.00
    },
    {
      title: 'Industrial Parts Rush Delivery',
      weight: 500,
      dimensions: '4m x 3m x 2m',
      pickupDetour: 12.3,
      dropoffDetour: 4.5,
      currentCeiling: 3500.00
    }
  ]);
  public addOnJobs$ = this.addOnJobs.asObservable();

  constructor() {
    this.simulateRouteTracking();
  }

  createRoute(id: string, origin: string, destination: string): Observable<any> {
    const route = {
      id,
      origin,
      destination,
      status: 'in-transit',
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours from now
    };

    const allRoutes = [...this.routes.value, route];
    this.routes.next(allRoutes);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('routes', JSON.stringify(allRoutes));
    }

    return new Observable(subscriber => {
      subscriber.next(route);
      subscriber.complete();
    });
  }

  updateRouteLocation(routeId: string, latitude: number, longitude: number, status: 'in-transit' | 'delivered' | 'delayed'): Observable<RouteUpdate> {
    const update: RouteUpdate = {
      id: 'update_' + Date.now(),
      routeId,
      latitude,
      longitude,
      timestamp: new Date(),
      status
    };

    const allUpdates = [...this.routeUpdates.value, update];
    this.routeUpdates.next(allUpdates);

    // Update route status if delivered
    if (status === 'delivered') {
      const routes = this.routes.value;
      const routeIndex = routes.findIndex(r => r.id === routeId);
      if (routeIndex >= 0) {
        routes[routeIndex].status = 'delivered';
        this.routes.next([...routes]);
      }
    }

    return new Observable(subscriber => {
      subscriber.next(update);
      subscriber.complete();
    });
  }

  getRoutes() {
    return this.routes.value;
  }

  getAddOnJobs() {
    return this.addOnJobs.value;
  }

  private simulateRouteTracking() {
    // Simulate live tracking updates
    setInterval(() => {
      const routes = this.routes.value;
      if (routes.length > 0) {
        const randomRoute = routes[Math.floor(Math.random() * routes.length)];
        const lat = 22.5726 + (Math.random() - 0.5) * 0.1;
        const lon = 88.3639 + (Math.random() - 0.5) * 0.1;
        this.updateRouteLocation(randomRoute.id, lat, lon, 'in-transit').subscribe();
      }
    }, 30000); // Update every 30 seconds
  }

  private loadRoutesFromStorage(): any[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [
        {
          id: 'TX-902',
          origin: 'Sector Alpha Industrial Node',
          destination: 'Coast Hub Base',
          status: 'in-transit',
          createdAt: new Date(Date.now() - 60 * 60 * 1000),
          estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000)
        }
      ];
    }
    const routes = localStorage.getItem('routes');
    return routes ? JSON.parse(routes) : [
      {
        id: 'TX-902',
        origin: 'Sector Alpha Industrial Node',
        destination: 'Coast Hub Base',
        status: 'in-transit',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000)
      }
    ];
  }
}
