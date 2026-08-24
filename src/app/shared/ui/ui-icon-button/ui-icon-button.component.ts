import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-icon-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="icon-button"
      [class.icon-button--danger]="variant === 'danger'"
      [attr.aria-label]="ariaLabel || label"
      (click)="clicked.emit()"
    >
      <span>{{ icon }}</span>
      <span>{{ label }}</span>
    </button>
  `,
  styles: [
    `
      .icon-button {
        appearance: none;
        border: 0;
        background: rgba(20, 50, 46, 0.06);
        color: #12322d;
        border-radius: 999px;
        padding: 0.5rem 0.8rem;
        font: inherit;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
      }

      .icon-button--danger {
        color: #8f2e2b;
        background: rgba(159, 61, 55, 0.1);
      }
    `,
  ],
})
export class UiIconButtonComponent {
  @Input() icon = '+';
  @Input() label = '';
  @Input() ariaLabel = '';
  @Input() variant: 'neutral' | 'danger' = 'neutral';
  @Output() clicked = new EventEmitter<void>();
}
