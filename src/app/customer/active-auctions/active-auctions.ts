import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideMessageCircleMore } from '@lucide/angular';
import { TenderService } from '../../services/tender.service';

@Component({
  selector: 'app-active-auctions',
  standalone: true,
  imports: [CommonModule, LucideMessageCircleMore],
  templateUrl: './active-auctions.html'
})
export class ActiveAuctionsComponent implements OnInit {
  activeTenders: any[] = [];

  constructor(private tenderService: TenderService) {}

  ngOnInit() {
    this.tenderService.activeTenders$.subscribe(tenders => {
      this.activeTenders = tenders;
    });
  }
}