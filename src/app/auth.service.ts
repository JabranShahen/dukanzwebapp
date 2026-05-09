import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import { environment } from './environments/environment';
import { StaffService } from './services/staff.service';
import { UserService } from './services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth;

  // undefined = Firebase hasn't resolved yet; null = signed out; User = signed in
  private readonly userSubject = new BehaviorSubject<User | null | undefined>(undefined);
  private readonly currentAreaIdSubject = new BehaviorSubject<string | null>(null);
  private readonly currentRoleSubject = new BehaviorSubject<string>('operator');
  private readonly profileReadySubject = new BehaviorSubject<boolean>(false);

  currentAreaId: string | null = null;
  currentRole = 'operator';
  currentName = '';

  /** Emits once Firebase has resolved the auth state (skips the initial undefined) */
  readonly user$: Observable<User | null> = this.userSubject.pipe(
    filter((u): u is User | null => u !== undefined)
  );

  readonly currentAreaId$ = this.currentAreaIdSubject.asObservable();
  readonly currentRole$ = this.currentRoleSubject.asObservable();
  readonly profileReady$ = this.profileReadySubject.asObservable();

  constructor(
    private readonly router: Router,
    private readonly injector: Injector
  ) {
    const app = getApps().length
      ? getApps()[0]
      : initializeApp(environment.firebase);
    this.auth = getAuth(app);

    onAuthStateChanged(this.auth, user => {
      this.userSubject.next(user);
      if (user) {
        this.profileReadySubject.next(false);
        this.loadUserProfile();
      } else {
        this.setProfile(null, 'operator', '');
        this.profileReadySubject.next(true);
      }
    });
  }

  isAuthenticated(): boolean {
    const state = this.userSubject.value;
    return state !== null && state !== undefined;
  }

  getSessionEmail(): string {
    const state = this.userSubject.value;
    return (state && state !== undefined) ? (state.email ?? '') : '';
  }

  async getIdToken(): Promise<string | null> {
    const state = this.userSubject.value;
    if (!state) return null;
    return state.getIdToken();
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  private readonly superAdminEmails = new Set([
    'jabran.shaheen@gmail.com',
    'jabranshaheen@hotmail.com'
  ]);

  private loadUserProfile(): void {
    const firebaseUser = this.userSubject.value;
    const sessionEmail = this.getSessionEmail().toLowerCase();

    const isEmailUser = firebaseUser?.providerData
      .some((provider) => provider.providerId === 'password') ?? false;

    if (isEmailUser) {
      const staffService = this.injector.get(StaffService);
      staffService.getMe().subscribe({
        next: (staff) => {
          const role = this.superAdminEmails.has(sessionEmail)
            ? 'superadmin'
            : (staff.role ?? 'operator');
          this.setProfile(staff.areaId ?? null, role, staff.name ?? '');
          this.profileReadySubject.next(true);
        },
        error: () => {
          const role = this.superAdminEmails.has(sessionEmail) ? 'superadmin' : 'operator';
          this.setProfile(null, role, '');
          this.profileReadySubject.next(true);
        }
      });
      return;
    }

    const userService = this.injector.get(UserService);
    userService.getMe().subscribe({
      next: (user) => {
        // Hardcoded super-admin emails override the DB role
        const role = this.superAdminEmails.has(sessionEmail)
          ? 'superadmin'
          : (user.role ?? 'operator');
        this.setProfile(user.areaId ?? null, role, user.name ?? '');
        this.profileReadySubject.next(true);
      },
      error: () => {
        const role = this.superAdminEmails.has(sessionEmail) ? 'superadmin' : 'operator';
        this.setProfile(null, role, '');
        this.profileReadySubject.next(true);
      }
    });
  }

  private setProfile(areaId: string | null, role: string, name: string): void {
    this.currentAreaId = areaId;
    this.currentRole = role || 'operator';
    this.currentName = name;
    this.currentAreaIdSubject.next(this.currentAreaId);
    this.currentRoleSubject.next(this.currentRole);
  }
}
