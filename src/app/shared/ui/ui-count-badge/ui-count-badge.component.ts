import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-count-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="badge">
      <span class="count">{{ count }}</span>
      <span class="label">{{ label }}</span>
    </div>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.65rem 0.85rem;
        border-radius: 999px;
        background: rgba(29, 82, 74, 0.08);
        color: #12322d;
      }

      .count {
        width: 1.8rem;
        height: 1.8rem;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: #1f6f62;
        color: white;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .label {
        font-size: 0.92rem;
        font-weight: 600;
      }
    `,
  ],
})
export class UiCountBadgeComponent {
  @Input() count = 0;
  @Input() label = '';
}
