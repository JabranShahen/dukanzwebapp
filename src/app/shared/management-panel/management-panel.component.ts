import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-management-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel-shell" [class.panel-shell--dense]="density === 'dense'">
      <div class="panel-head" *ngIf="title || description">
        <div>
          <h2 *ngIf="title">{{ title }}</h2>
          <p *ngIf="description">{{ description }}</p>
        </div>
        <ng-content select="[panel-actions]"></ng-content>
      </div>
      <ng-content></ng-content>
    </section>
  `,
  styles: [
    `
      .panel-shell {
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(28, 44, 42, 0.08);
        border-radius: 28px;
        padding: 1.5rem;
        box-shadow: 0 24px 80px rgba(16, 33, 31, 0.08);
        backdrop-filter: blur(16px);
      }

      .panel-shell--dense {
        padding: 1rem 1.1rem;
      }

      .panel-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      h2 {
        margin: 0;
        font-size: 1.15rem;
      }

      p {
        margin: 0.4rem 0 0;
        color: var(--tone-muted);
        line-height: 1.55;
      }
    `,
  ],
})
export class ManagementPanelComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() density: 'normal' | 'dense' = 'normal';
}
