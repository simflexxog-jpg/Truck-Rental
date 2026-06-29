import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenderService } from '../../services/tender.service';

@Component({
  selector: 'app-active-auctions',
  standalone: true,
  imports: [CommonModule],
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