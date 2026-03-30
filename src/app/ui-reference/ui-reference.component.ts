import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManagementHeaderComponent } from '../shared/management-header/management-header.component';
import { ManagementPanelComponent } from '../shared/management-panel/management-panel.component';
import { UiButtonComponent } from '../shared/ui/ui-button/ui-button.component';
import { UiCountBadgeComponent } from '../shared/ui/ui-count-badge/ui-count-badge.component';
import { UiStatusPillComponent } from '../shared/ui/ui-status-pill/ui-status-pill.component';

@Component({
  selector: 'app-ui-reference',
  standalone: true,
  imports: [
    CommonModule,
    ManagementHeaderComponent,
    ManagementPanelComponent,
    UiButtonComponent,
    UiCountBadgeComponent,
    UiStatusPillComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-management-header
        eyebrow="Shared UI"
        title="UI reference"
        subtext="This internal route keeps the new Dukanz design system coherent while more feature stories land."
      ></app-management-header>

      <div class="grid">
        <app-management-panel title="Buttons">
          <div class="cluster">
            <app-ui-button>Primary action</app-ui-button>
            <app-ui-button variant="secondary">Secondary action</app-ui-button>
            <app-ui-button variant="ghost">Ghost action</app-ui-button>
          </div>
        </app-management-panel>

        <app-management-panel title="Tokens">
          <div class="cluster">
            <app-ui-count-badge [count]="12" label="live items"></app-ui-count-badge>
            <app-ui-status-pill label="Visible" tone="success"></app-ui-status-pill>
            <app-ui-status-pill label="Needs review" tone="warning"></app-ui-status-pill>
          </div>
        </app-management-panel>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.5rem;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }

      .cluster {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      @media (max-width: 800px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class UiReferenceComponent {}
