import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenderService } from '../../services/tender.service';

@Component({
  selector: 'app-tender-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tender-create.html'
})
export class TenderCreateComponent {
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  
  tenderData = {
    title: '',
    weight: null,
    duration: null,
    origin: '',
    destination: ''
  };

  constructor(private tenderService: TenderService) {}

  broadcastTender() {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.tenderData.title || !this.tenderData.weight || !this.tenderData.duration || 
        !this.tenderData.origin || !this.tenderData.destination) {
      this.errorMessage = 'Please fill in all required fields.';
      this.isLoading = false;
      return;
    }

    this.tenderService.createTender(
      this.tenderData.title,
      this.tenderData.weight as number,
      this.tenderData.duration as number,
      this.tenderData.origin,
      this.tenderData.destination
    ).subscribe({
      next: (tender) => {
        this.successMessage = `Tender ${tender.id} deployed to active driver network!`;
        this.tenderData = { title: '', weight: null, duration: null, origin: '', destination: '' };
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to create tender. Please try again.';
        this.isLoading = false;
      }
    });
  }
}