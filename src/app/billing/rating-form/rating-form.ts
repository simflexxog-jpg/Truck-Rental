import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideStar } from '@lucide/angular';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-rating-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideStar],
  templateUrl: './rating-form.html'
})
export class RatingFormComponent {
  stars = [1, 2, 3, 4, 5];
  currentRating = 0;
  hoveredRating = 0;
  feedbackText = '';
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private billingService: BillingService) {}

  setRating(rating: number) {
    this.currentRating = rating;
  }

  setHover(rating: number) {
    this.hoveredRating = rating;
  }

  clearHover() {
    this.hoveredRating = 0;
  }

  submitReview() {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.currentRating === 0) {
      this.errorMessage = 'Please select a star rating before submitting.';
      return;
    }

    this.isSubmitting = true;

    this.billingService.submitRating(
      'tender_' + Date.now(),
      'operator_' + Date.now(),
      'Operator Alpha',
      this.currentRating,
      this.feedbackText
    ).subscribe({
      next: (rating) => {
        this.successMessage = 'Review committed to the decentralized network!';
        this.currentRating = 0;
        this.feedbackText = '';
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to submit review. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}