import { Router } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  it('protects Customers instead of the old Users route for superadmins', () => {
    const guard = new AuthGuard({} as AuthService, {} as Router);
    const routes = (guard as any).superAdminRoutes as string[];

    expect(routes).toContain('/dashboard/customers');
    expect(routes).toContain('/dashboard/staff');
    expect(routes).not.toContain('/dashboard/users');
  });
});
