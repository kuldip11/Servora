import { describe, expect, it } from 'vitest';
import { loginSchema, refreshTokenSchema, signupSchema } from '../auth';

const validSignup = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  password: 'password123',
};

describe('signupSchema', () => {
  it('accepts valid signup data without the deprecated tenant field', () => {
    expect(signupSchema.parse(validSignup)).toEqual(validSignup);
  });
  it('accepts the optional tenantName compatibility field', () => {
    expect(signupSchema.parse({ ...validSignup, tenantName: 'Main Restaurant' }).tenantName).toBe('Main Restaurant');
  });
  it.each([
    ['firstName', ''], ['lastName', ''], ['email', 'not-an-email'], ['password', 'short'],
  ])('rejects invalid %s', (field, value) => {
    expect(signupSchema.safeParse({ ...validSignup, [field]: value }).success).toBe(false);
  });
  it('enforces password and name upper bounds', () => {
    expect(signupSchema.safeParse({ ...validSignup, firstName: 'a'.repeat(51) }).success).toBe(false);
    expect(signupSchema.safeParse({ ...validSignup, password: 'p'.repeat(101) }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts a valid email and non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'ada@example.com', password: 'x' }).success).toBe(true);
  });
  it('rejects an invalid email or empty password', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'ada@example.com', password: '' }).success).toBe(false);
  });
});

describe('refreshTokenSchema', () => {
  it('requires a non-empty refresh token', () => {
    expect(refreshTokenSchema.safeParse({ refreshToken: 'token' }).success).toBe(true);
    expect(refreshTokenSchema.safeParse({ refreshToken: '' }).success).toBe(false);
  });
});
