import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { LucideChevronDown, LucideChevronUp, LucideSendHorizontal } from '@lucide/angular';
import { ChatService } from '../../services/chat.service';
import { TenderService, Tender } from '../../services/tender.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-ai-chatbox',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, LucideChevronDown, LucideChevronUp, LucideSendHorizontal],
  templateUrl: './ai-chatbox.html'
})
export class AiChatboxComponent implements AfterViewChecked, OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  
  isMinimized = false;
  userInput = '';
  isLoading = false;
  messages: any[] = [];
  isChatEnabled = false;
  activeTenderId?: string;
  currentUser: User | null = null;

  constructor(
    private chatService: ChatService,
    private tenderService: TenderService,
    private authService: AuthService,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit() {
    // Move host element to document.body to avoid map stacking context issues (Leaflet creates its own stacking context).
    try {
      if (typeof document !== 'undefined' && this.el && this.el.nativeElement) {
        this.renderer.appendChild(document.body, this.el.nativeElement);
      }
    } catch (e) {
      // ignore in SSR or if running in restricted environment
    }

    // After rendering, check for map overlap and adjust position if needed
    try {
      if (typeof document !== 'undefined') {
        const adjust = () => {
          try {
            const host: HTMLElement = this.el.nativeElement;
            const chatRect = host.getBoundingClientRect();
            const mapEl = document.getElementById('map-container');
            if (!mapEl) return;
            const mapRect = mapEl.getBoundingClientRect();

            // If chat bottom overlaps the map top, move chat above the map
            if (chatRect.bottom > mapRect.top) {
              const newTop = Math.max(8, mapRect.top - chatRect.height - 12);
              host.style.top = `${newTop}px`;
              host.style.bottom = 'auto';
            } else {
              // ensure default bottom placement when not overlapping
              host.style.bottom = '24px';
              host.style.top = 'auto';
            }
          } catch (e) { /* ignore */ }
        };

        // run once after a short delay to allow layout
        setTimeout(adjust, 50);

        // re-adjust on resize and scroll
        this._unlistenResize = this.renderer.listen('window', 'resize', adjust);
        this._unlistenScroll = this.renderer.listen('window', 'scroll', adjust);
      }
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy() {
    try {
      if (typeof document !== 'undefined' && this.el && this.el.nativeElement && document.body.contains(this.el.nativeElement)) {
        this.renderer.removeChild(document.body, this.el.nativeElement);
      }
    } catch (e) {
      // ignore
    }
    try {
      if (this._unlistenResize) this._unlistenResize();
      if (this._unlistenScroll) this._unlistenScroll();
    } catch (e) {}
  }

  private _unlistenResize: (() => void) | null = null;
  private _unlistenScroll: (() => void) | null = null;

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateChatAvailability(this.tenderService.getTenders(), user);
    });

    this.tenderService.tenders$.subscribe(tenders => {
      this.updateChatAvailability(tenders || [], this.currentUser ?? this.authService.getCurrentUser());
    });

    this.chatService.messages$.subscribe(messages => {
      if (!this.activeTenderId) {
        this.messages = [];
        return;
      }
      this.messages = messages.filter(message => message.tenderId === this.activeTenderId);
    });

    this.tenderService.getTenders();
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  getDisplayName(user: User | null): string {
    if (!user) {
      return 'You';
    }
    return user.entityName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'You';
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading || !this.isChatEnabled || !this.activeTenderId) return;

    const messageText = this.userInput;
    this.userInput = '';
    this.isLoading = true;

    const sender = this.getDisplayName(this.currentUser);
    const senderRole: 'client' | 'driver' = this.currentUser?.role === 'partner' ? 'driver' : 'client';

    this.chatService.addLocalMessage({
      id: `pending_${Date.now()}`,
      sender,
      senderRole,
      text: messageText,
      timestamp: new Date(),
      tenderId: this.activeTenderId,
    });

    this.chatService.sendMessage(sender, senderRole, messageText, this.activeTenderId).subscribe({
      next: () => {
        this.isLoading = false;
        this.chatService.loadMessagesForTender(this.activeTenderId!);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to send chat message', err);
      }
    });
  }

  updateChatAvailability(tenders: Tender[], user: User | null) {
    this.currentUser = user;
    const eligibleTender = (tenders || []).find(tender => this.isTenderEligibleForChat(tender, user));
    this.isChatEnabled = !!eligibleTender;
    this.activeTenderId = eligibleTender?.id;

    if (this.activeTenderId) {
      this.chatService.loadMessagesForTender(this.activeTenderId);
    } else {
      this.messages = [];
    }
  }

  private isTenderEligibleForChat(tender: Tender, user: User | null): boolean {
    if (!tender || !user || tender.status !== 'assigned' || !tender.paymentApproved) {
      return false;
    }

    return user.role === 'partner'
      ? tender.assignedPartnerId === user.id
      : tender.customerId === user.id;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}