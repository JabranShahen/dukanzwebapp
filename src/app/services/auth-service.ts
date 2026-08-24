import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  User,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { AuthSession } from '../entities/auth-session';
import { TokenStorageService } from '../auth/token-storage.service';
import { getDukanzFirebaseAuth } from '../auth/firebase-client';

interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly firebaseAuth = getDukanzFirebaseAuth();
  private readonly sessionSubject: BehaviorSubject<AuthSession | null>;
  readonly session$;
  readonly isAuthenticated$;

  constructor(private readonly storage: TokenStorageService) {
    this.sessionSubject = new BehaviorSubject<AuthSession | null>(this.storage.readSession());
    this.session$ = this.sessionSubject.asObservable();
    this.isAuthenticated$ = this.session$.pipe(map((session) => Boolean(session?.token)));
    void setPersistence(this.firebaseAuth, browserLocalPersistence);
    onAuthStateChanged(this.firebaseAuth, (user) => {
      void this.syncSessionFromUser(user);
    });
  }

  get snapshot(): AuthSession | null {
    return this.sessionSubject.value;
  }

  signIn(credentials: LoginRequest): Observable<AuthSession> {
    return from(this.signInWithFirebase(credentials));
  }

  establishSession(session: AuthSession): void {
    this.storage.writeSession(session);
    this.sessionSubject.next(session);
  }

  signOut(): void {
    void firebaseSignOut(this.firebaseAuth);
    this.storage.clear();
    this.sessionSubject.next(null);
  }

  getToken(): string | null {
    return this.snapshot?.token ?? this.storage.getToken();
  }

  async getFreshToken(forceRefresh = false): Promise<string | null> {
    const currentUser = this.firebaseAuth.currentUser;
    if (!currentUser) {
      return this.getToken();
    }

    const session = await this.createSession(currentUser, forceRefresh);
    this.establishSession(session);
    return session.token;
  }

  private async signInWithFirebase(credentials: LoginRequest): Promise<AuthSession> {
    await setPersistence(this.firebaseAuth, browserLocalPersistence);
    const result = await signInWithEmailAndPassword(this.firebaseAuth, credentials.email, credentials.password);
    const session = await this.createSession(result.user, true);
    this.establishSession(session);
    return session;
  }

  private async syncSessionFromUser(user: User | null): Promise<void> {
    if (!user) {
      this.storage.clear();
      this.sessionSubject.next(null);
      return;
    }

    const session = await this.createSession(user);
    this.establishSession(session);
  }

  private async createSession(user: User, forceRefresh = false): Promise<AuthSession> {
    const token = await user.getIdToken(forceRefresh);
    return {
      token,
      email: user.email ?? this.snapshot?.email ?? '',
      displayName: user.displayName ?? user.email ?? 'Dukanz operator',
      issuedAt: new Date().toISOString(),
    };
  }
}
