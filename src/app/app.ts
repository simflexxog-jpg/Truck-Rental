import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/sidebar/sidebar';
import { HeaderComponent } from './core/header/header';
import { AiChatboxComponent } from './core/ai-chatbox/ai-chatbox';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, AiChatboxComponent, HttpClientModule],
  templateUrl: './app.html'
})
export class App {
  // We manage the sidebar state here so both the sidebar and header can react to it
  isSidebarCollapsed = false;

  onSidebarToggle(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }
}