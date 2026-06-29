import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, filter, retryWhen, delay, tap } from 'rxjs/operators';

export interface WebSocketMessage {
  type: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$?: WebSocketSubject<WebSocketMessage>;
  private connectionState = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectionState.asObservable();
  private incomingMessages = new Subject<WebSocketMessage>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private get webSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host || 'localhost:4000';
    return `${protocol}://${host}/ws`;
  }

  connect() {
    if (this.socket$) {
      return;
    }

    this.socket$ = webSocket<WebSocketMessage>({
      url: this.webSocketUrl,
      deserializer: ({ data }) => {
        try {
          return JSON.parse(data as string);
        } catch {
          return { type: 'unknown', payload: data };
        }
      },
      serializer: msg => JSON.stringify(msg),
      openObserver: {
        next: () => {
          this.connectionState.next(true);
          console.debug('[WebSocket] connected');
        }
      },
      closeObserver: {
        next: () => {
          this.connectionState.next(false);
          console.debug('[WebSocket] disconnected');
          this.socket$ = undefined;
          setTimeout(() => this.connect(), 3000);
        }
      }
    });

    this.socket$.pipe(
      retryWhen(errors => errors.pipe(
        tap(err => console.warn('[WebSocket] reconnecting after error', err)),
        delay(3000)
      )),
      catchError(err => {
        console.error('[WebSocket] error', err);
        return of({ type: 'websocket_error', payload: err });
      })
    ).subscribe(message => {
      if (message && message.type) {
        this.incomingMessages.next(message);
      }
    });
  }

  disconnect() {
    this.socket$?.complete();
    this.socket$ = undefined;
    this.connectionState.next(false);
  }

  send(message: WebSocketMessage) {
    if (this.socket$) {
      this.socket$.next(message);
    }
  }

  onMessage(type?: string): Observable<WebSocketMessage> {
    if (!type) {
      return this.incomingMessages.asObservable();
    }
    return this.incomingMessages.asObservable().pipe(
      filter(message => message.type === type)
    );
  }
}
