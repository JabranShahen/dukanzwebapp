import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManagementHeaderComponent } from '../shared/management-header/management-header.component';
import { ManagementPanelComponent } from '../shared/management-panel/management-panel.component';

@Component({
  selector: 'app-account-placeholder',
  standalone: true,
  imports: [CommonModule, ManagementHeaderComponent, ManagementPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-management-header
        eyebrow="Account placeholder"
        title="Account management slot"
        subtext="This protected route reserves the future account surface without borrowing MenuNest-specific assumptions or the legacy Dukanz template shell."
      ></app-management-header>

      <app-management-panel title="Planned follow-up" description="Future stories can move user profile, access control, and business identity workflows into this route.">
        <p>For Story 1.2, the account route exists so the new navigation map is complete and the migration boundary is explicit.</p>
      </app-management-panel>
    </div>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.5rem;
      }

      p {
        margin: 0;
        color: var(--tone-muted);
        line-height: 1.7;
      }
    `,
  ],
})
export class AccountPlaceholderComponent {}
