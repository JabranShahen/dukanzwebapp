import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-status-pill',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="pill"
      [class.pill--success]="tone === 'success'"
      [class.pill--warning]="tone === 'warning'"
      [class.pill--danger]="tone === 'danger'"
    >
      {{ label }}
    </span>
  `,
  styles: [
    `
      .pill {
        display: inline-flex;
        align-items: center;
        padding: 0.4rem 0.65rem;
        border-radius: 999px;
        background: rgba(20, 50, 46, 0.08);
        color: #12322d;
        font-size: 0.82rem;
        font-weight: 600;
      }

      .pill--success {
        color: #165c4f;
        background: rgba(22, 92, 79, 0.12);
      }

      .pill--warning {
        color: #8a5a12;
        background: rgba(173, 124, 34, 0.14);
      }

      .pill--danger {
        color: #8f2e2b;
        background: rgba(159, 61, 55, 0.12);
      }
    `,
  ],
})
export class UiStatusPillComponent {
  @Input() label = '';
  @Input() tone: 'neutral' | 'success' | 'warning' | 'danger' = 'neutral';
}
