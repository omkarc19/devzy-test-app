const { hashPassword, verifyPassword, generateToken, parseToken } = require('../../src/auth');

describe('auth module', () => {
  test('hashPassword returns a 64-char hex string', () => {
    expect(hashPassword('abc')).toMatch(/^[a-f0-9]{64}$/);
  });

  test('hashPassword is deterministic', () => {
    expect(hashPassword('abc')).toBe(hashPassword('abc'));
  });

  test('hashPassword differs across passwords', () => {
    expect(hashPassword('abc')).not.toBe(hashPassword('def'));
  });

  test('verifyPassword returns true for correct password', () => {
    const h = hashPassword('mypassword');
    expect(verifyPassword('mypassword', h)).toBe(true);
  });

  test('verifyPassword returns false for wrong password', () => {
    const h = hashPassword('mypassword');
    expect(verifyPassword('different', h)).toBe(false);
  });

  test('generateToken includes the user id after the colon', () => {
    expect(generateToken(42)).toMatch(/:42$/);
  });

  test('generateToken produces different tokens for the same user', () => {
    expect(generateToken(42)).not.toBe(generateToken(42));
  });

  test('parseToken extracts the user id', () => {
    const t = generateToken(42);
    expect(parseToken(t)).toEqual({ userId: 42 });
  });

  test('parseToken returns null for malformed input', () => {
    expect(parseToken('garbage')).toBeNull();
    expect(parseToken('')).toBeNull();
    expect(parseToken(null)).toBeNull();
    expect(parseToken('a:b:c')).toBeNull();
    expect(parseToken('abc:notanumber')).toBeNull();
  });
});
