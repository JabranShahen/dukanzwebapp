import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

interface DukanzSession {
  email: string;
  issuedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'dukanz.webapp.session';

  constructor(private readonly router: Router) {}

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  getSessionEmail(): string {
    return this.getSession()?.email ?? '';
  }

  login(email: string, password: string): boolean {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedPassword = (password || '').trim();

    if (!normalizedEmail || !normalizedPassword) {
      return false;
    }

    const session: DukanzSession = {
      email: normalizedEmail,
      issuedAt: new Date().toISOString()
    };

    localStorage.setItem(this.storageKey, JSON.stringify(session));
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.router.navigate(['/login']);
  }

  private getSession(): DukanzSession | null {
    const rawSession = localStorage.getItem(this.storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawSession) as DukanzSession;
      if (!parsed?.email) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
