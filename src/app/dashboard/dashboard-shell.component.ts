import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../services/auth-service';
import { UiButtonComponent } from '../shared/ui/ui-button/ui-button.component';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterOutlet, RouterLink, RouterLinkActive, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <div>
          <span class="eyebrow">Dukanz Ops</span>
          <h1>Dashboard</h1>
        </div>

        <nav class="nav">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="nav-link--active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            class="nav-link"
          >
            {{ item.label }}
          </a>
        </nav>

        <div class="session-card" *ngIf="authService.session$ | async as session">
          <strong>{{ session.displayName || session.email }}</strong>
          <span>{{ session.email }}</span>
        </div>

        <app-ui-button variant="ghost" (clicked)="logout()">Sign out</app-ui-button>
      </aside>

      <section class="workspace">
        <router-outlet></router-outlet>
      </section>
    </div>
  `,
  styles: [
    `
      .dashboard-shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 280px 1fr;
        background:
          radial-gradient(circle at top left, rgba(31, 111, 98, 0.18), transparent 24%),
          linear-gradient(180deg, #f7f4eb 0%, #edf3ef 100%);
      }

      .sidebar {
        padding: 1.5rem;
        border-right: 1px solid rgba(20, 50, 46, 0.08);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        backdrop-filter: blur(16px);
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.78rem;
        color: var(--tone-accent-strong);
      }

      h1 {
        margin: 0.6rem 0 0;
        font-size: 2rem;
      }

      .nav {
        display: grid;
        gap: 0.45rem;
      }

      .nav-link {
        text-decoration: none;
        color: #21433e;
        padding: 0.85rem 1rem;
        border-radius: 18px;
        background: transparent;
      }

      .nav-link--active {
        background: rgba(31, 111, 98, 0.12);
        color: #12322d;
        font-weight: 700;
      }

      .session-card {
        display: grid;
        gap: 0.2rem;
        margin-top: auto;
        padding: 1rem;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.82);
        box-shadow: 0 12px 30px rgba(16, 33, 31, 0.08);
      }

      .session-card span {
        color: var(--tone-muted);
      }

      .workspace {
        padding: 1.5rem;
      }

      @media (max-width: 960px) {
        .dashboard-shell {
          grid-template-columns: 1fr;
        }

        .sidebar {
          border-right: 0;
          border-bottom: 1px solid rgba(20, 50, 46, 0.08);
        }

        .nav {
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }
      }
    `,
  ],
})
export class DashboardShellComponent {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly navItems: NavItem[] = [
    { label: 'Overview', route: '/dashboard' },
    { label: 'Categories', route: '/dashboard/categories' },
    { label: 'Products', route: '/dashboard/products' },
    { label: 'Account', route: '/dashboard/account' },
    { label: 'Settings', route: '/dashboard/settings' },
    { label: 'UI Reference', route: '/dashboard/ui-reference' },
  ];

  logout(): void {
    this.authService.signOut();
    void this.router.navigateByUrl('/sign-in');
  }
}
