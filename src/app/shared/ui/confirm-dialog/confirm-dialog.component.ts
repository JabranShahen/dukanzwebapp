import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirm action';
  @Input() message = 'Are you sure you want to continue?';
  @Input() confirmLabel = 'Yes';
  @Input() cancelLabel = 'No';
  @Input() pending = false;
  @Input() destructive = false;

  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  onCancel(): void {
    if (!this.pending) {
      this.cancelled.emit();
    }
  }

  onConfirm(): void {
    if (!this.pending) {
      this.confirmed.emit();
    }
  }
}
