import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AiMessage {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private readonly apiBase = 'http://localhost:3000/api';

  private conversationHistory = new BehaviorSubject<AiMessage[]>([
    {
      id: 'msg_init',
      text: 'Hello! Looking for a low-cost tender or trying to optimize an add-on route detour? Ask me anything.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  public conversationHistory$ = this.conversationHistory.asObservable();

  constructor(private http: HttpClient) {}

  sendQuery(userQuery: string): Observable<AiMessage> {
    // Add user message
    const userMessage: AiMessage = {
      id: 'msg_' + Date.now(),
      text: userQuery,
      sender: 'user',
      timestamp: new Date()
    };

    const history = [...this.conversationHistory.value, userMessage];
    this.conversationHistory.next(history);

    return new Observable(subscriber => {
      this.http.post<{ reply: string }>(`${this.apiBase}/chat/send`, {
        sender: 'user',
        senderRole: 'customer',
        text: userQuery
      }).subscribe({
        next: (res) => {
          const aiResponse: AiMessage = {
            id: 'msg_' + (Date.now() + 1),
            text: res.reply || 'I can help with tenders, bids, routing, and billing on Renta.',
            sender: 'ai',
            timestamp: new Date()
          };

          const updatedHistory = [...this.conversationHistory.value, aiResponse];
          this.conversationHistory.next(updatedHistory);
          subscriber.next(aiResponse);
          subscriber.complete();
        },
        error: () => {
          const fallback: AiMessage = {
            id: 'msg_' + (Date.now() + 1),
            text: 'I am temporarily offline. Try asking about a tender, bid, or payment and I will help shortly.',
            sender: 'ai',
            timestamp: new Date()
          };
          const updatedHistory = [...this.conversationHistory.value, fallback];
          this.conversationHistory.next(updatedHistory);
          subscriber.next(fallback);
          subscriber.complete();
        }
      });
    });
  }

  getConversationHistory(): AiMessage[] {
    return this.conversationHistory.value;
  }

  clearHistory(): void {
    this.conversationHistory.next([
      {
        id: 'msg_init',
        text: 'Hello! Looking for a low-cost tender or trying to optimize an add-on route detour? Ask me anything.',
        sender: 'ai',
        timestamp: new Date()
      }
    ]);
  }
}
