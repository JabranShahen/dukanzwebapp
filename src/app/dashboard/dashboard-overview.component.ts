import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManagementHeaderComponent } from '../shared/management-header/management-header.component';
import { ManagementPanelComponent } from '../shared/management-panel/management-panel.component';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, ManagementHeaderComponent, ManagementPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-management-header
        eyebrow="Process view"
        title="Team dashboard for daily system pulse"
        subtext="The new webapp is organized around route-first management surfaces, reusable primitives, and Dukanz-specific services for shared operations."
      ></app-management-header>

      <section class="grid">
        <app-management-panel title="What is ready" description="Story 1.2 establishes the baseline operating shape.">
          <ul>
            <li>Public, auth, and protected route groups are separated.</li>
            <li>ProductCategory, DukanzProduct, and DukanzConfig all have centralized service seams.</li>
            <li>Shared management panels, headers, and UI atoms drive the new screens.</li>
          </ul>
        </app-management-panel>

        <app-management-panel title="What remains deferred" description="These items are isolated rather than faked.">
          <ul>
            <li>Real backend login endpoint mapping.</li>
            <li>Deep CRUD workflows and modal polish.</li>
            <li>Legacy parity validation before deleting the legacy Dukanz web app.</li>
          </ul>
        </app-management-panel>
      </section>
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

      ul {
        margin: 0;
        padding-left: 1.2rem;
        color: var(--tone-muted);
        line-height: 1.7;
      }

      @media (max-width: 880px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardOverviewComponent {}
