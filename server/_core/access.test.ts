import { describe, expect, it } from 'vitest';
import { hasAdminToolsAccess } from './access';

describe('MB29A administrative access contract', () => {
  it('allows an explicit platform admin', () => {
    expect(hasAdminToolsAccess({ role: 'user', platformRole: 'admin', source: 'platform_admin_users' } as any)).toBe(true);
  });

  it('rejects manager and employee roles from the sovereign admin console', () => {
    expect(hasAdminToolsAccess({ role: 'user', platformRole: 'manager', source: 'platform_admin_users' } as any)).toBe(false);
    expect(hasAdminToolsAccess({ role: 'user', platformRole: 'employee', source: 'platform_admin_users' } as any)).toBe(false);
  });

  it('rejects anonymous-like and viewer identities', () => {
    expect(hasAdminToolsAccess({ role: 'viewer', platformRole: 'viewer', source: 'platform_admin_users' } as any)).toBe(false);
    expect(hasAdminToolsAccess(null)).toBe(false);
  });
});
