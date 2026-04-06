import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth;

  // undefined = Firebase hasn't resolved yet; null = signed out; User = signed in
  private readonly userSubject = new BehaviorSubject<User | null | undefined>(undefined);

  /** Emits once Firebase has resolved the auth state (skips the initial undefined) */
  readonly user$: Observable<User | null> = this.userSubject.pipe(
    filter((u): u is User | null => u !== undefined)
  );

  constructor(private readonly router: Router) {
    const app = getApps().length
      ? getApps()[0]
      : initializeApp(environment.firebase);
    this.auth = getAuth(app);

    onAuthStateChanged(this.auth, user => {
      this.userSubject.next(user);
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
}
