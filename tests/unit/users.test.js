const { db } = require('../../src/db');
const users = require('../../src/users');

beforeEach(() => {
  db.exec('DELETE FROM users');
});

describe('users module', () => {
  test('createUser persists and returns id and email', () => {
    const u = users.createUser('alice@example.com', 'password123');
    expect(u.id).toBeGreaterThan(0);
    expect(u.email).toBe('alice@example.com');
  });

  test('createUser rejects invalid email', () => {
    expect(() => users.createUser('not-an-email', 'password123')).toThrow('invalid email');
  });

  test('createUser rejects short password', () => {
    expect(() => users.createUser('a@b.com', 'abc')).toThrow('password too short');
  });

  test('createUser rejects missing fields', () => {
    expect(() => users.createUser(null, 'password123')).toThrow('invalid email');
    expect(() => users.createUser('a@b.com', null)).toThrow('password too short');
  });

  test('createUser enforces unique email', () => {
    users.createUser('a@b.com', 'password123');
    expect(() => users.createUser('a@b.com', 'differentpw')).toThrow();
  });

  test('getUser does not leak password_hash', () => {
    const { id } = users.createUser('a@b.com', 'password123');
    const u = users.getUser(id);
    expect(u.email).toBe('a@b.com');
    expect(u.password_hash).toBeUndefined();
  });

  test('getUser returns null for nonexistent id', () => {
    expect(users.getUser(99999)).toBeNull();
  });

  test('getUserByEmail includes password_hash for verification', () => {
    users.createUser('a@b.com', 'password123');
    const u = users.getUserByEmail('a@b.com');
    expect(u.password_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('listUsers returns all users in descending order', () => {
    users.createUser('a@b.com', 'password123');
    users.createUser('c@d.com', 'password456');
    const list = users.listUsers();
    expect(list).toHaveLength(2);
    expect(list[0].email).toBe('c@d.com');
  });

  test('deleteUser removes the user', () => {
    const { id } = users.createUser('a@b.com', 'password123');
    expect(users.deleteUser(id)).toBe(true);
    expect(users.getUser(id)).toBeNull();
  });

  test('deleteUser returns false when no row matches', () => {
    expect(users.deleteUser(99999)).toBe(false);
  });
});
