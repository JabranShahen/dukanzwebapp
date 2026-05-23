import { Component } from '@angular/core';

import { DataUpdatesService } from '../services/data-updates.service';

@Component({
  selector: 'app-data-updates',
  templateUrl: './data-updates.component.html',
  styleUrls: ['./data-updates.component.scss']
})
export class DataUpdatesComponent {
  showResetConfirmation = false;
  resetting = false;
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  constructor(private readonly dataUpdatesService: DataUpdatesService) {}

  openResetConfirmation(): void {
    if (this.resetting) {
      return;
    }

    this.showResetConfirmation = true;
  }

  cancelReset(): void {
    if (this.resetting) {
      return;
    }

    this.showResetConfirmation = false;
  }

  confirmReset(): void {
    if (this.resetting) {
      return;
    }

    this.resetting = true;
    this.dataUpdatesService.resetPurchase().subscribe({
      next: (result) => {
        this.resetting = false;
        this.showResetConfirmation = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = `Purchase reset complete. ${result.updatedOrderCount} orders updated.`;
      },
      error: () => {
        this.resetting = false;
        this.showResetConfirmation = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to reset purchase data.';
      }
    });
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }
}
