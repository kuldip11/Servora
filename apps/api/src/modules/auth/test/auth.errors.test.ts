import { describe, expect, it } from 'vitest';
import { invalidCredentials, userInactive, invalidRefreshToken, authUserNotFound } from '../auth.errors';
describe('auth errors', () => {
  it('maps invalid credentials and inactive users to the same unauthorized response', () => {
    expect(invalidCredentials().toJSON()).toMatchObject({ code:'UNAUTHORIZED', message:'Invalid credentials' });
    expect(userInactive().details).toMatchObject({ reason:'AUTH_USER_INACTIVE' });
  });
  it('maps refresh failures and missing users to stable errors', () => {
    expect(invalidRefreshToken().details).toMatchObject({ reason:'AUTH_INVALID_REFRESH_TOKEN' });
    expect(authUserNotFound().toJSON()).toMatchObject({ code:'NOT_FOUND' });
    expect(authUserNotFound().details).toMatchObject({ reason:'USER_NOT_FOUND' });
  });
});
