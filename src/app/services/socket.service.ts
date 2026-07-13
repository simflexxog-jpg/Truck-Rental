import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.apiUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
  }

  joinRoom(room: 'customer' | 'partner'): void {
    this.socket.emit('join-room', room);
  }

  listen<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      const handler = (payload: T) => observer.next(payload);
      this.socket.on(event, handler);
      return () => this.socket.off(event, handler);
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
