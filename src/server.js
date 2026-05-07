const express = require('express');
const path = require('path');
const { dbPath } = require('./db');
const visits = require('./visits');
const users = require('./users');
const { verifyPassword, generateToken } = require('./auth');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const port = parseInt(process.env.PORT || '3000', 10);

app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    port,
    dbPath,
    pid: process.pid,
    uptimeSec: Math.floor(process.uptime()),
  });
});

// Visits
app.post('/api/visit', (_req, res) => {
  res.status(201).json(visits.createVisit());
});
app.get('/api/visits', (_req, res) => {
  res.json(visits.listVisits());
});
app.get('/api/visit/:id', (req, res) => {
  const v = visits.getVisit(parseInt(req.params.id, 10));
  if (!v) return res.status(404).json({ error: 'not found' });
  res.json(v);
});

// Users
app.post('/api/users', (req, res) => {
  try {
    const { email, password } = req.body || {};
    res.status(201).json(users.createUser(email, password));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get('/api/users', (_req, res) => {
  res.json(users.listUsers());
});
app.get('/api/users/:id', (req, res) => {
  const u = users.getUser(parseInt(req.params.id, 10));
  if (!u) return res.status(404).json({ error: 'not found' });
  res.json(u);
});
app.delete('/api/users/:id', (req, res) => {
  const ok = users.deleteUser(parseInt(req.params.id, 10));
  res.status(ok ? 204 : 404).end();
});

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const u = users.getUserByEmail(email);
  if (!u || !verifyPassword(password, u.password_hash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  res.json({ token: generateToken(u.id), user: { id: u.id, email: u.email } });
});

const server = app.listen(port, () => {
  console.log(`[stub-app] listening on http://localhost:${port} db=${dbPath}`);
});

const shutdown = (sig) => () => {
  console.log(`[stub-app] received ${sig}, shutting down`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));
// ai generated TCs
// ai generated TCs
// ai generated TCs
// ai generated TCs
