import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, OnChanges, SimpleChanges, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-live-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './live-chat.html'
})
export class LiveChatComponent implements AfterViewChecked, OnInit, OnChanges, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  messageInput = '';
  messages: any[] = [];
  @Input() tenderId?: string;
  canSend = true;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.chatService.messages$.subscribe(messages => this.messages = messages);
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.handleWindowActivity);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (this.tenderId) {
      this.loadMessagesForTender(this.tenderId);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tenderId'] && this.tenderId) {
      this.loadMessagesForTender(this.tenderId);
    }
  }

  sendMessage() {
    if (!this.messageInput.trim()) return;
    if (this.tenderId && !this.isAllowedToSend()) { alert('Chat is only available after assignment for drivers.'); return; }
    const messageText = this.messageInput;
    this.messageInput = '';
    const senderRole: any = this.tenderId ? 'driver' : 'user';
    this.chatService.addLocalMessage({
      id: `pending_${Date.now()}`,
      sender: 'You',
      senderRole,
      text: messageText,
      timestamp: new Date(),
      tenderId: this.tenderId,
    });
    this.chatService.sendMessage('You', senderRole, messageText, this.tenderId).subscribe({
      next: () => {
        if (this.tenderId) {
          this.chatService.loadMessagesForTender(this.tenderId);
        }
      },
      error: (err) => console.error('Failed to send message', err)
    });
  }

  isAllowedToSend(): boolean {
    if (!this.tenderId) return true;
    try {
      const anyWindow: any = window as any;
      if (anyWindow && anyWindow.__TENDER_CACHE__) {
        const t = anyWindow.__TENDER_CACHE__[this.tenderId];
        return t ? t.status === 'assigned' : false;
      }
    } catch(e) {}
    return true;
  }

  private handleWindowActivity = () => {
    if (this.tenderId) {
      this.loadMessagesForTender(this.tenderId);
    }
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.tenderId) {
      this.loadMessagesForTender(this.tenderId);
    }
  };

  private loadMessagesForTender(tenderId: string) {
    this.chatService.loadMessagesForTender(tenderId);
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.handleWindowActivity);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  ngAfterViewChecked() {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}