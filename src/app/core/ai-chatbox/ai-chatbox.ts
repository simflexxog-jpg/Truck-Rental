import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { AiChatService } from '../../services/ai-chat.service';

@Component({
  selector: 'app-ai-chatbox',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './ai-chatbox.html'
})
export class AiChatboxComponent implements AfterViewChecked, OnInit {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  
  isMinimized = false;
  userInput = '';
  isLoading = false;
  messages: any[] = [];

  constructor(private aiChatService: AiChatService) {}

  ngOnInit() {
    this.aiChatService.conversationHistory$.subscribe(messages => {
      this.messages = messages;
    });
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userQuery = this.userInput;
    this.userInput = '';
    this.isLoading = true;

    this.aiChatService.sendQuery(userQuery).subscribe({
      next: (response) => {
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to get AI response', err);
      }
    });
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