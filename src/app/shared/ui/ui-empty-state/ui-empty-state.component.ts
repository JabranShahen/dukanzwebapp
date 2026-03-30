import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiButtonComponent } from '../ui-button/ui-button.component';

@Component({
  selector: 'app-ui-empty-state',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <div class="icon">{{ icon }}</div>
      <h3>{{ title }}</h3>
      <p>{{ body }}</p>
      <app-ui-button *ngIf="ctaLabel" variant="secondary" (clicked)="ctaClick.emit()">
        {{ ctaLabel }}
      </app-ui-button>
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: grid;
        gap: 0.8rem;
        justify-items: start;
        padding: 1.25rem 0;
      }

      .icon {
        width: 3rem;
        height: 3rem;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: rgba(43, 149, 134, 0.12);
        color: var(--tone-accent-strong);
        font-weight: 700;
      }

      h3,
      p {
        margin: 0;
      }

      p {
        color: var(--tone-muted);
        line-height: 1.6;
      }
    `,
  ],
})
export class UiEmptyStateComponent {
  @Input() icon = '00';
  @Input() title = '';
  @Input() body = '';
  @Input() ctaLabel = '';
  @Output() ctaClick = new EventEmitter<void>();
}
