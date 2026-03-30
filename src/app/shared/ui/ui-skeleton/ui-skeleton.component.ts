import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-stack">
      <span class="skeleton-row" *ngFor="let row of rowsArray" [style.height]="height"></span>
    </div>
  `,
  styles: [
    `
      .skeleton-stack {
        display: grid;
        gap: 0.9rem;
      }

      .skeleton-row {
        display: block;
        width: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(32, 60, 55, 0.08), rgba(32, 60, 55, 0.16), rgba(32, 60, 55, 0.08));
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite linear;
      }

      @keyframes shimmer {
        from {
          background-position: 200% 0;
        }
        to {
          background-position: -200% 0;
        }
      }
    `,
  ],
})
export class UiSkeletonComponent {
  @Input() rows = 4;
  @Input() height = '1rem';

  get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, index) => index);
  }
}
