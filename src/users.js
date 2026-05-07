const { db } = require('./db');
const { hashPassword } = require('./auth');

const createUser = (email, password) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new Error('invalid email');
  }
  if (!password || password.length < 6) {
    throw new Error('password too short');
  }
  const hash = hashPassword(password);
  const r = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hash);
  return { id: Number(r.lastInsertRowid), email };
};

const getUser = (id) => {
  const u = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(id);
  return u || null;
};

const getUserByEmail = (email) =>
  db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email);

const listUsers = () =>
  db.prepare('SELECT id, email, created_at FROM users ORDER BY id DESC').all();

const deleteUser = (id) => {
  const r = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return r.changes > 0;
};

const updateUserEmail = (id, newEmail) => {
  if (!newEmail || typeof newEmail !== 'string' || !newEmail.includes('@')) {
    throw new Error('invalid email');
  }
  const r = db.prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail, id);
  return r.changes > 0;
};

module.exports = {
  createUser, getUser, getUserByEmail, listUsers, deleteUser, updateUserEmail,
};
