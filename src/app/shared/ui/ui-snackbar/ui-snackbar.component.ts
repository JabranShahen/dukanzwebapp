import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-ui-snackbar',
  templateUrl: './ui-snackbar.component.html',
  styleUrls: ['./ui-snackbar.component.scss']
})
export class UiSnackbarComponent implements OnChanges, OnDestroy {
  @Input() message = '';
  @Input() tone: 'success' | 'error' = 'success';
  @Output() dismissed = new EventEmitter<void>();

  visible = false;

  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.clearTimer();

      if (this.message) {
        this.visible = true;
        this.dismissTimer = setTimeout(() => {
          this.visible = false;
          this.dismissed.emit();
        }, 3500);
      } else {
        this.visible = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  dismiss(): void {
    this.clearTimer();
    this.visible = false;
    this.dismissed.emit();
  }

  private clearTimer(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
