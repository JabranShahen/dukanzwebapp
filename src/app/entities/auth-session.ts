export interface AuthSession {
  token: string;
  email: string;
  displayName?: string;
  issuedAt: string;
}
