import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loading = false;
  errorMessage = '';

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        void this.router.navigate(['/dashboard']);
      }
    });
  }

  async submit(): Promise<void> {
    this.errorMessage = '';
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.loading = true;

    try {
      await this.authService.login(email, password);
      this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      this.errorMessage = this.friendlyError(err);
    } finally {
      this.loading = false;
    }
  }

  private friendlyError(err: unknown): string {
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-email'
      ) {
        return 'Incorrect email or password.';
      }
      if (code === 'auth/too-many-requests') {
        return 'Too many failed attempts. Please try again later.';
      }
      if (code === 'auth/user-disabled') {
        return 'This account has been disabled. Please contact support.';
      }
      if (code === 'auth/network-request-failed') {
        return 'Network error. Please check your connection and try again.';
      }
    }
    return 'Login failed. Please check your connection and try again.';
  }
}
