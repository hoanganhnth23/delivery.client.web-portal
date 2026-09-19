import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/utils/constants';
import { resolveAdminPrincipalId } from '@/modules/admin/services/firebaseChatService';

const admin = {
  id: 42,
  authId: 7001,
  email: 'admin@example.test',
  name: 'Admin Test',
  role: USER_ROLES.ADMIN,
};

describe('Firebase support chat identity', () => {
  it('uses the stable auth id instead of the profile id', () => {
    expect(resolveAdminPrincipalId(admin, null)).toBe('7001');
  });

  it('does not inspect a legacy browser bearer when stable auth id is absent', () => {
    const payload = btoa(JSON.stringify({ principal_id: 7001 }));
    const token = `header.${payload}.signature`;

    expect(() => resolveAdminPrincipalId({ ...admin, authId: undefined }, token))
      .toThrow('Phiên ADMIN thiếu auth id ổn định');
  });
});
