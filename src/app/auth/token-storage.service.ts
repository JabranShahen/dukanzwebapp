import { Injectable } from '@angular/core';

import { AuthSession } from '../entities/auth-session';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private readonly tokenKey = environment.auth.tokenStorageKey;
  private readonly sessionKey = environment.auth.sessionStorageKey;

  getToken(): string | null {
    return this.getStorage()?.getItem(this.tokenKey) ?? null;
  }

  readSession(): AuthSession | null {
    const raw = this.getStorage()?.getItem(this.sessionKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      this.clear();
      return null;
    }
  }

  writeSession(session: AuthSession): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.tokenKey, session.token);
    storage.setItem(this.sessionKey, JSON.stringify(session));
  }

  clear(): void {
    const storage = this.getStorage();
    storage?.removeItem(this.tokenKey);
    storage?.removeItem(this.sessionKey);
  }

  private getStorage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
