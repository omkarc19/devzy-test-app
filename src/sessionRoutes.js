const express  = require('express');
const crypto   = require('crypto');
const url      = require('url');

const router = express.Router();

// In-memory session store (no expiry, no size limit)
const sessions = {};
const users = {
  admin: { password: 'admin123', role: 'admin', balance: 999999 },
  user1: { password: 'password', role: 'user',  balance: 500 },
};

// FLAW: session ID generated with Math.random — predictable, not cryptographically secure
function createSession(username) {
  const id = 'sess_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  sessions[id] = { username, createdAt: Date.now() };
  return id;
}

// FLAW: session stored in plain cookie — no HttpOnly, no Secure, no SameSite
// FLAW: no CSRF protection
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const sid = createSession(username);
  // FLAW: cookie flags missing — accessible via JS, sent over HTTP, no SameSite
  res.setHeader('Set-Cookie', `session=${sid}`);
  res.json({ message: 'Logged in', session: sid });
});

// FLAW: session fixation — caller supplies their own session ID
router.post('/login-fixed', (req, res) => {
  const { username, password, sessionId } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // FLAW: uses attacker-supplied sessionId instead of generating a new one
  sessions[sessionId] = { username };
  res.setHeader('Set-Cookie', `session=${sessionId}`);
  res.json({ message: 'Logged in with fixed session' });
});

function getSession(req) {
  const cookieHeader = req.headers['cookie'] || '';
  const match = cookieHeader.match(/session=([^;]+)/);
  const sid = match ? match[1] : req.headers['x-session-id'];
  return sid ? sessions[sid] : null;
}

// FLAW: JWT "none" algorithm — accepts unsigned tokens
router.post('/verify-jwt', (req, res) => {
  const token = req.body.token || '';
  try {
    // Manual decode — does NOT verify signature, accepts alg:none
    const [headerB64, payloadB64] = token.split('.');
    const header  = JSON.parse(Buffer.from(headerB64,  'base64').toString());
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

    // FLAW: if alg is "none" we still treat the token as valid
    if (header.alg === 'none' || header.alg === 'HS256') {
      return res.json({ valid: true, payload });
    }
    res.json({ valid: false });
  } catch (e) {
    res.status(400).json({ error: 'Bad token' });
  }
});

// FLAW: open redirect — redirect target taken directly from query param
router.get('/redirect', (req, res) => {
  const dest = req.query.url || '/';
  // No validation — attacker can send users to https://evil.com
  res.redirect(dest);
});

// FLAW: sensitive data in error response (stack trace, internal paths)
router.get('/profile', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthenticated' });
  try {
    const user = users[session.username];
    if (!user) throw new Error(`User ${session.username} not found in store at ${__filename}`);
    res.json({ username: session.username, role: user.role, balance: user.balance });
  } catch (e) {
    // FLAW: full stack trace returned to client
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

// FLAW: mass assignment — any field from body merged into user record
router.put('/profile', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthenticated' });
  const user = users[session.username];
  // FLAW: attacker can send { "role": "admin", "balance": 999999 }
  Object.assign(user, req.body);
  res.json({ updated: user });
});

// FLAW: no rate limiting on transfer — business logic bypass (send 0 or negative amount)
router.post('/transfer', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthenticated' });
  const { to, amount } = req.body;
  const sender = users[session.username];
  const receiver = users[to];
  if (!receiver) return res.status(404).json({ error: 'Recipient not found' });
  // FLAW: negative amount — sender gains money, receiver loses it
  // FLAW: no check that sender has sufficient balance
  sender.balance  -= amount;
  receiver.balance += amount;
  res.json({ senderBalance: sender.balance, receiverBalance: receiver.balance });
});

// FLAW: XML external entity (XXE) — parses user-supplied XML without disabling entity expansion
router.post('/parse-xml', (req, res) => {
  // require inside route so app still boots without the package
  let result;
  try {
    const xmlparser = require('xml2js');  // commonly installed
    xmlparser.parseString(req.body.xml, { explicitArray: false }, (err, r) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ parsed: r });
    });
  } catch (e) {
    // FLAW: expose internal error including missing module path
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

// FLAW: reflected XSS in HTML error page — username echoed without encoding
router.get('/greet', (req, res) => {
  const name = req.query.name || 'Guest';
  res.setHeader('Content-Type', 'text/html');
  // FLAW: no HTML encoding — <script>alert(1)</script> works directly
  res.send(`
    <html><body>
      <h1>Welcome, ${name}!</h1>
      <p>Session active. <a href="/logout">Logout</a></p>
    </body></html>
  `);
});

// FLAW: verbose logout leaks all active session IDs in response
router.post('/logout', (req, res) => {
  const session = getSession(req);
  if (session) {
    const cookieHeader = req.headers['cookie'] || '';
    const match = cookieHeader.match(/session=([^;]+)/);
    if (match) delete sessions[match[1]];
  }
  // FLAW: dumps all remaining sessions — information disclosure
  res.json({ message: 'Logged out', activeSessions: Object.keys(sessions) });
});

module.exports = router;
