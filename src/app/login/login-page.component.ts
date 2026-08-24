import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../services/auth-service';
import { UiButtonComponent } from '../shared/ui/ui-button/ui-button.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="auth-shell">
      <section class="auth-card">
        <span class="eyebrow">Operator login</span>
        <h1>Access the new Dukanz dashboard.</h1>
        <p>Operator access uses the Dukanz Firebase project and stores a real Firebase ID token behind the app auth service and interceptor boundary.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>
            <span>Email</span>
            <input type="email" formControlName="email" placeholder="operator@dukanz.com" />
          </label>

          <label>
            <span>Password</span>
            <input type="password" formControlName="password" placeholder="Enter your password" />
          </label>

          <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

          <div class="actions">
            <app-ui-button [type]="'submit'" [disabled]="submitting">
              {{ submitting ? 'Checking access...' : 'Login' }}
            </app-ui-button>
            <app-ui-button variant="ghost" routerLink="/sign-in">Need the alternate sign-in route?</app-ui-button>
          </div>
        </form>
      </section>
    </main>
  `,
  styles: [
    `
      .auth-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
        background:
          radial-gradient(circle at top right, rgba(31, 111, 98, 0.22), transparent 28%),
          linear-gradient(180deg, #f7f4eb 0%, #eef4f1 100%);
      }

      .auth-card {
        width: min(620px, 100%);
        background: rgba(255, 255, 255, 0.92);
        border-radius: 30px;
        padding: 2rem;
        box-shadow: 0 24px 80px rgba(16, 33, 31, 0.1);
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.78rem;
        color: var(--tone-accent-strong);
      }

      h1 {
        margin: 0.8rem 0 0.9rem;
        line-height: 1.02;
      }

      p {
        color: var(--tone-muted);
        line-height: 1.65;
      }

      form {
        display: grid;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      label {
        display: grid;
        gap: 0.45rem;
      }

      input {
        width: 100%;
        border-radius: 18px;
        border: 1px solid rgba(20, 50, 46, 0.12);
        padding: 0.95rem 1rem;
        font: inherit;
      }

      .actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .error {
        margin: 0;
        color: #8f2e2b;
      }
    `,
  ],
})
export class LoginPageComponent {
  private readonly builder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.builder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submitting = false;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.authService
      .signIn(this.form.getRawValue())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        },
      });
  }
}
