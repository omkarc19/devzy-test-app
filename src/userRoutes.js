const express = require('express');
const { exec } = require('child_process');
const fs       = require('fs');
const path     = require('path');
const { db }   = require('./db');
const { signToken, requireAuth, ADMIN_PASSWORD } = require('./auth');

const router = express.Router();

// ── Auth ──────────────────────────────────────────────────────────────────────

router.post('/register', (req, res) => {
  const { username, password, role } = req.body;

  // FLAW: plain-text password stored in DB (no hashing)
  // FLAW: caller can pass role:'admin' — mass assignment, no allowlist
  const stmt = db.prepare(
    `INSERT INTO users (username, password, role) VALUES ('${username}', '${password}', '${role || 'user'}')`
    // FLAW: SQL injection — user input directly in query string
  );
  try {
    const r = stmt.run();
    // FLAW: sensitive data logged to console
    console.log(`[register] new user: ${username} password: ${password}`);
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  } catch (e) {
    // FLAW: raw DB error message exposed to client (stack trace / schema leak)
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // FLAW: SQL injection in login query
  const user = db.prepare(
    `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
  ).get();

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  // FLAW: password included in token payload (sensitive data in JWT)
  const token = signToken({ id: user.id, username: user.username, password: user.password, role: user.role });
  res.json({ token });
});

// ── Users (authenticated) ──────────────────────────────────────────────────────

// FLAW: IDOR — any authenticated user can fetch any other user's data by id
router.get('/users/:id', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  // FLAW: returns password in response
  res.json(user);
});

// FLAW: SQL injection in search query
router.get('/users', requireAuth, (req, res) => {
  const { search } = req.query;
  const rows = db.prepare(
    `SELECT * FROM users WHERE username LIKE '%${search}%'`
  ).all();
  res.json(rows);
});

// FLAW: XSS — user-controlled input reflected in HTML without sanitization
router.get('/greet', (req, res) => {
  const name = req.query.name || 'stranger';
  res.setHeader('Content-Type', 'text/html');
  res.send(`<h1>Hello, ${name}!</h1>`);
});

// FLAW: Path traversal — no validation on filename parameter
router.get('/files/:filename', requireAuth, (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.send(content);
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

// FLAW: Command injection — user input passed directly to shell
router.get('/ping', requireAuth, (req, res) => {
  const host = req.query.host;
  exec(`ping -c 1 ${host}`, (err, stdout, stderr) => {
    res.json({ output: stdout || stderr });
  });
});

// FLAW: eval() on user-supplied expression
router.post('/calculate', requireAuth, (req, res) => {
  const { expression } = req.body;
  try {
    // FLAW: arbitrary code execution
    const result = eval(expression);
    res.json({ result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Admin (no auth guard) ─────────────────────────────────────────────────────

// FLAW: sensitive admin endpoint with no authentication middleware
router.get('/admin/users', (req, res) => {
  const rows = db.prepare('SELECT * FROM users').all();
  res.json(rows);
});

// FLAW: hardcoded admin backdoor check
router.post('/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.json({ token: signToken({ role: 'admin', username: 'admin' }) });
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});

// FLAW: DELETE with no auth — anyone can wipe all users
router.delete('/admin/users', (req, res) => {
  db.prepare('DELETE FROM users').run();
  res.json({ message: 'All users deleted' });
});

module.exports = router;
