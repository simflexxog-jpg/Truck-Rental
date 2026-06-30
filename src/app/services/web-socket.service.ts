import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

// Use dynamic require to avoid build-time import errors if `socket.io-client` is not installed.
declare const require: any;
let io: any = undefined;
type Socket = any;

export interface WebSocketMessage {
  type: string;
  payload?: any;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket?: Socket;
  private connectionState = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectionState.asObservable();
  private incomingMessages = new Subject<WebSocketMessage>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private get socketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const host = window.location.hostname || 'localhost';
    const port = window.location.port || '3000';
    return `${protocol}://${host}:${port}`;
  }

  connect() {
    if (this.socket) return;
    try {
      if (!io) {
        // try to pick up a global `io` (e.g., loaded on the page) or require the package
        io = (typeof window !== 'undefined' && (window as any).io) ? (window as any).io : require('socket.io-client');
      }
      if (!io) {
        console.warn('socket.io-client not available; real-time disabled');
        return;
      }
      this.socket = io(this.socketUrl, { transports: ['websocket', 'polling'] });
      this.socket.on('connect', () => { this.connectionState.next(true); });
      this.socket.on('disconnect', () => { this.connectionState.next(false); });
      this.socket.onAny((evt: string, payload: any) => {
        this.incomingMessages.next({ type: evt, payload });
      });
    } catch (e) {
      console.warn('Socket.io connect failed', e);
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
    this.connectionState.next(false);
  }

  // Support both `send(type, payload)` and legacy `send({ type, payload })` calls
  send(messageOrType: string | WebSocketMessage, payload?: any) {
    if (!this.socket) return;
    if (typeof messageOrType === 'string') {
      this.socket.emit(messageOrType, payload);
    } else {
      // emit the event name as the message type and the payload as data
      this.socket.emit(messageOrType.type, messageOrType.payload);
    }
  }

  onMessage(type?: string): Observable<WebSocketMessage> {
    if (!type) return this.incomingMessages.asObservable();
    return this.incomingMessages.asObservable().pipe(filter(m => m.type === type));
  }
}
