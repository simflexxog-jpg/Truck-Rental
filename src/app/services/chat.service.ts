import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { WebSocketService, WebSocketMessage } from './web-socket.service';

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'user' | 'client' | 'driver';
  text: string;
  timestamp: Date;
  tenderId?: string;
}

const API_BASE = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messages = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messages.asObservable();

  constructor(private http: HttpClient, private webSocketService: WebSocketService) {
    this.webSocketService.onMessage('chat_message').subscribe(message => {
      const payload = message.payload as ChatMessage;
      if (payload) {
        const all = [...this.messages.value, payload];
        this.messages.next(all);
      }
    });
  }

  sendMessage(sender: string, senderRole: 'user' | 'client' | 'driver', text: string, tenderId?: string): Observable<ChatMessage> {
    const payload = { sender, senderRole, text, tenderId };
    this.webSocketService.send({ type: 'chat_message', payload });
    return this.http.post<ChatMessage>(`${API_BASE}/chat/send`, payload).pipe(
      tap(msg => {
        const all = [...this.messages.value, msg];
        this.messages.next(all);
      }),
      catchError(err => {
        const msg: ChatMessage = { id: 'msg_' + Date.now(), sender, senderRole, text, timestamp: new Date(), tenderId };
        const all = [...this.messages.value, msg];
        this.messages.next(all);
        return of(msg as ChatMessage);
      })
    );
  }

  addLocalMessage(message: ChatMessage) {
    const all = [...this.messages.value, message];
    this.messages.next(all);
  }

  loadMessagesForTender(tenderId: string) {
    this.http.get<ChatMessage[]>(`${API_BASE}/chat/${tenderId}`).pipe(
      catchError(() => of([]))
    ).subscribe(msgs => this.messages.next(msgs));
  }

  getMessages(): ChatMessage[] { return this.messages.value; }
}
