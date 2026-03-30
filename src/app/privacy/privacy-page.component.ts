import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page-shell">
      <section class="card">
        <a routerLink="/">Back to Dukanz home</a>
        <h1>Privacy</h1>
        <p>Dukanz Next only stores operator session data required for authenticated dashboard calls. Category, product, and config data are requested from the Dukanz API rather than persisted locally.</p>
        <p>This rebuild intentionally avoids fake accounts, demo credentials, and copied legacy handlers. Any incomplete auth behavior remains isolated behind the auth service boundary until the real backend contract is finalized.</p>
      </section>
    </main>
  `,
  styles: [
    `
      .page-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
        background: linear-gradient(180deg, #f7f4eb 0%, #edf3ef 100%);
      }

      .card {
        width: min(760px, 100%);
        background: white;
        border-radius: 28px;
        padding: 2rem;
        box-shadow: 0 24px 80px rgba(16, 33, 31, 0.08);
      }

      a {
        color: var(--tone-accent-strong);
        text-decoration: none;
      }

      h1 {
        margin-bottom: 0.75rem;
      }

      p {
        line-height: 1.7;
        color: var(--tone-muted);
      }
    `,
  ],
})
export class PrivacyPageComponent {}
