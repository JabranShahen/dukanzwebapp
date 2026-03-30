import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      class="button"
      [class.button--secondary]="variant === 'secondary'"
      [class.button--ghost]="variant === 'ghost'"
      [class.button--danger]="variant === 'danger'"
      [class.button--full]="fullWidth"
      [disabled]="disabled"
      (click)="handleClick($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      .button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 0.9rem 1.25rem;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        background: linear-gradient(135deg, #1f6f62, #2b9586);
        color: #f8faf7;
        transition:
          transform 150ms ease,
          box-shadow 150ms ease,
          opacity 150ms ease;
        box-shadow: 0 14px 30px rgba(31, 111, 98, 0.22);
      }

      .button:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .button--secondary {
        background: #edf5f2;
        color: #14322e;
        box-shadow: none;
      }

      .button--ghost {
        background: transparent;
        color: #14322e;
        box-shadow: inset 0 0 0 1px rgba(20, 50, 46, 0.14);
      }

      .button--danger {
        background: linear-gradient(135deg, #9f3d37, #c95a52);
        box-shadow: 0 14px 30px rgba(159, 61, 55, 0.2);
      }

      .button--full {
        width: 100%;
      }
    `,
  ],
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      return;
    }

    this.clicked.emit(event);
  }
}
