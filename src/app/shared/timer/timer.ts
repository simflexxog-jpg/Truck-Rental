import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="font-mono tracking-wide" [ngClass]="remainingSeconds < 60 ? 'text-rose-400 animate-pulse' : 'text-amber-400'">
      {{ formatTime(remainingSeconds) }}
    </span>
  `
})
export class TimerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() seconds: number = 300;
  @Input() targetTime?: string | Date | number;
  remainingSeconds: number = 0;
  private intervalId: any;

  ngOnInit() {
    this.resetTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['targetTime'] || changes['seconds']) {
      this.resetTimer();
    }
  }

  private resetTimer() {
    this.clearTimer();
    this.remainingSeconds = this.computeRemainingSeconds();
    this.intervalId = setInterval(() => {
      this.remainingSeconds = this.computeRemainingSeconds();
      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = 0;
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private computeRemainingSeconds(): number {
    if (this.targetTime) {
      const target = typeof this.targetTime === 'string' || typeof this.targetTime === 'number'
        ? new Date(this.targetTime)
        : new Date(this.targetTime);
      const remaining = Math.ceil((target.getTime() - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return this.seconds > 0 ? this.seconds : 0;
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }
}