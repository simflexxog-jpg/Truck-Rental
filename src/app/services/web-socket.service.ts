import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface WebSocketMessage {
  type: string;
  payload?: any;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket?: WebSocket;
  private connectionState = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectionState.asObservable();
  private incomingMessages = new Subject<WebSocketMessage>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private get socketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname || 'localhost';
    const port = window.location.port;
    const base = port ? `${host}:${port}` : host;
    return `${protocol}://${base}/ws`;
  }

  connect() {
    if (typeof window === 'undefined' || this.socket || !window.WebSocket) {
      return;
    }

    try {
      this.socket = new WebSocket(this.socketUrl);
      this.socket.onopen = () => {
        this.connectionState.next(true);
      };
      this.socket.onclose = () => {
        this.connectionState.next(false);
        this.socket = undefined;
      };
      this.socket.onerror = () => {
        this.connectionState.next(false);
      };
      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          if (message && message.type) {
            this.incomingMessages.next({ type: message.type, payload: message.payload });
          }
        } catch (e) {
          console.warn('WebSocket message parse failed', e);
        }
      };
    } catch (e) {
      console.warn('WebSocket connect failed', e);
    }
  }

  disconnect() {
    this.socket?.close();
    this.socket = undefined;
    this.connectionState.next(false);
  }

  // Support both `send(type, payload)` and legacy `send({ type, payload })` calls
  send(messageOrType: string | WebSocketMessage, payload?: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const envelope = typeof messageOrType === 'string'
      ? { type: messageOrType, payload }
      : { type: messageOrType.type, payload: messageOrType.payload };
    this.socket.send(JSON.stringify(envelope));
  }

  onMessage(type?: string): Observable<WebSocketMessage> {
    if (!type) return this.incomingMessages.asObservable();
    return this.incomingMessages.asObservable().pipe(filter(m => m.type === type));
  }
}
