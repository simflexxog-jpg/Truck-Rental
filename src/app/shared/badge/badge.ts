import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-medium border uppercase tracking-wider"
          [ngClass]="getClasses()">
      {{ text }}
    </span>
  `
})
export class BadgeComponent {
  @Input() text: string = 'Status';
  @Input() variant: 'success' | 'warning' | 'error' | 'info' = 'info';

  getClasses() {
    switch(this.variant) {
      case 'success': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'warning': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'error': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'info': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
  }
}