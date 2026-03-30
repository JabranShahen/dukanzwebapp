import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiButtonComponent } from '../ui/ui-button/ui-button.component';

@Component({
  selector: 'app-management-header',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header-shell">
      <div class="copy">
        <span class="eyebrow" *ngIf="eyebrow">{{ eyebrow }}</span>
        <h1 *ngIf="title">{{ title }}</h1>
        <p *ngIf="subtext">{{ subtext }}</p>
      </div>
      <app-ui-button *ngIf="ctaLabel" [variant]="ctaVariant" [type]="'button'" (clicked)="ctaClick.emit()">
        {{ ctaLabel }}
      </app-ui-button>
    </header>
  `,
  styles: [
    `
      .header-shell {
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        align-items: end;
        flex-wrap: wrap;
      }

      .copy {
        max-width: 48rem;
      }

      .eyebrow {
        display: inline-flex;
        margin-bottom: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.75rem;
        color: var(--tone-accent-strong);
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3rem);
        line-height: 0.98;
      }

      p {
        margin: 0.85rem 0 0;
        color: var(--tone-muted);
        font-size: 1rem;
        line-height: 1.65;
      }
    `,
  ],
})
export class ManagementHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtext = '';
  @Input() ctaLabel = '';
  @Input() ctaVariant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Output() ctaClick = new EventEmitter<void>();
}
