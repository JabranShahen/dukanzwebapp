import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { UiButtonComponent } from '../shared/ui/ui-button/ui-button.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="landing-shell">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">Dukanz Next Webapp</span>
          <h1>Store operations rebuilt on a clean Angular foundation.</h1>
          <p>
            This new web surface keeps the legacy Dukanz web app intact as a reference while moving Dukanz toward a
            route-driven, service-centered architecture with intentional management UX.
          </p>
          <div class="hero-actions">
            <app-ui-button routerLink="/sign-in">Enter operator flow</app-ui-button>
            <app-ui-button variant="ghost" routerLink="/privacy">Privacy</app-ui-button>
          </div>
        </div>
        <div class="hero-card">
          <h2>Foundation routes</h2>
          <ul>
            <li>Public landing + privacy</li>
            <li>Dedicated login and sign-in routes</li>
            <li>Protected dashboard shell</li>
            <li>Category, product, account, settings, and UI reference surfaces</li>
          </ul>
        </div>
      </section>

      <section class="grid">
        <article>
          <h3>Architecture direction</h3>
          <p>Feature folders, centralized services, shared UI atoms, guarded routes, and environment-driven API wiring.</p>
        </article>
        <article>
          <h3>Business logic migration</h3>
          <p>ProductCategory, DukanzProduct, DukanzConfig, token handling, and auth boundaries are reintroduced without legacy template debt.</p>
        </article>
        <article>
          <h3>Operator experience</h3>
          <p>Loading, empty, and populated management states are first-class so the rebuild stays usable while deeper workflow stories land.</p>
        </article>
      </section>
    </main>
  `,
  styles: [
    `
      .landing-shell {
        min-height: 100vh;
        padding: 2rem;
        background:
          radial-gradient(circle at top left, rgba(49, 133, 118, 0.2), transparent 30%),
          linear-gradient(180deg, #f7f4eb 0%, #f4efe2 100%);
      }

      .hero {
        max-width: 1100px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.7fr 1fr;
        gap: 1.5rem;
        align-items: stretch;
      }

      .hero-copy,
      .hero-card,
      article {
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(20, 50, 46, 0.08);
        border-radius: 30px;
        padding: 1.75rem;
        box-shadow: 0 24px 80px rgba(16, 33, 31, 0.08);
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.78rem;
        color: var(--tone-accent-strong);
      }

      h1 {
        font-size: clamp(2.6rem, 6vw, 5rem);
        line-height: 0.94;
        margin: 0.8rem 0 1rem;
      }

      h2,
      h3 {
        margin-top: 0;
      }

      p,
      li {
        color: var(--tone-muted);
        line-height: 1.7;
      }

      .hero-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: 1.4rem;
      }

      .grid {
        max-width: 1100px;
        margin: 1.5rem auto 0;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }

      ul {
        padding-left: 1.1rem;
        margin: 1rem 0 0;
      }

      @media (max-width: 900px) {
        .hero,
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class LandingPageComponent {}
