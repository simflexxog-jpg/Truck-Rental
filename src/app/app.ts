import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/sidebar/sidebar';
import { HeaderComponent } from './core/header/header';
import { AiChatboxComponent } from './core/ai-chatbox/ai-chatbox';
import { SidebarService } from './services/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, AiChatboxComponent, HttpClientModule],
  templateUrl: './app.html'
})
export class App {
  private sidebarService = inject(SidebarService);
  isSidebarCollapsed$ = this.sidebarService.sidebarCollapsed$;
}