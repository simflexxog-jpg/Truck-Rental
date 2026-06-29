import { Injectable } from '@angular/core';
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
  private aiResponses = [
    'Analyzing your request against active tender database...',
    'Found 3 matching logistics partners. Would you like details?',
    'Current lowest bid for your route is $1,240. Competitive rate detected.',
    'Route optimization suggests 15% fuel savings via Highway 5 corridor.',
    'Your delivery has been assigned to Alpha-Carrier Express.',
    'Real-time tracking available. Current location: Sector 5, ETA 2h 30m',
    'Payment processed. Reference #TXN-00951-X12',
    'Partner ratings: Alpha Express 4.8/5, Barasat Corp 4.6/5',
    'Recommended: Bundle this with our next tender for volume discount',
    'Compliance check complete. All documentation verified for interstate movement'
  ];

  private conversationHistory = new BehaviorSubject<AiMessage[]>([
    {
      id: 'msg_init',
      text: 'Hello! Looking for a low-cost tender or trying to optimize an add-on route detour? Ask me anything.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  public conversationHistory$ = this.conversationHistory.asObservable();

  constructor() {}

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

    // Simulate AI response after 1.5 seconds
    return new Observable(subscriber => {
      setTimeout(() => {
        const aiResponse: AiMessage = {
          id: 'msg_' + (Date.now() + 1),
          text: this.aiResponses[Math.floor(Math.random() * this.aiResponses.length)],
          sender: 'ai',
          timestamp: new Date()
        };

        const updatedHistory = [...this.conversationHistory.value, aiResponse];
        this.conversationHistory.next(updatedHistory);
        subscriber.next(aiResponse);
        subscriber.complete();
      }, 1500);
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
