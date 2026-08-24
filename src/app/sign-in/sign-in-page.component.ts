import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { UiButtonComponent } from '../shared/ui/ui-button/ui-button.component';

@Component({
  selector: 'app-sign-in-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="sign-in-shell">
      <section class="frame">
        <span class="eyebrow">Protected route boundary</span>
        <h1>Dukanz sign-in route is live.</h1>
        <p>The auth service, token storage strategy, guard, and interceptor seam are all in place. Real backend sign-in remains intentionally unresolved until the Dukanz auth contract is confirmed.</p>
        <div class="actions">
          <app-ui-button routerLink="/login">Open login form</app-ui-button>
          <app-ui-button variant="ghost" routerLink="/">Back to landing</app-ui-button>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .sign-in-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
        background: linear-gradient(180deg, #f7f4eb 0%, #eef4f1 100%);
      }

      .frame {
        width: min(680px, 100%);
        background: white;
        border-radius: 28px;
        padding: 2rem;
        box-shadow: 0 24px 80px rgba(16, 33, 31, 0.08);
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.78rem;
        color: var(--tone-accent-strong);
      }

      h1 {
        margin: 0.8rem 0 1rem;
      }

      p {
        color: var(--tone-muted);
        line-height: 1.65;
      }

      .actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: 1.2rem;
      }
    `,
  ],
})
export class SignInPageComponent {}
