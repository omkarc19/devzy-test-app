const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');
const { exec } = require('child_process');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// FLAW: no file type validation — any file including .sh/.exe accepted
// FLAW: no file size limit — DoS via large upload
router.post('/upload', (req, res) => {
  const { filename, content, encoding } = req.body;

  // FLAW: path traversal — filename not sanitized, e.g. "../../etc/passwd"
  const dest = path.join(UPLOAD_DIR, filename);

  const data = encoding === 'base64'
    ? Buffer.from(content, 'base64')
    : Buffer.from(content);

  fs.writeFileSync(dest, data);

  // FLAW: file path disclosed in response
  console.log(`[upload] saved file: ${dest}`);
  res.json({ saved: dest, size: data.length });
});

// FLAW: insecure deserialization — JSON.parse on raw user input then spread into object
router.post('/import', (req, res) => {
  const raw = req.body.data;
  try {
    const parsed = JSON.parse(raw);
    // FLAW: prototype pollution — user can send {"__proto__":{"admin":true}}
    const record = Object.assign({}, parsed);
    res.json({ imported: record });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// FLAW: command injection via user-controlled archive name
router.post('/extract', (req, res) => {
  const { archive } = req.body;
  exec(`tar -xf ${UPLOAD_DIR}/${archive} -C ${UPLOAD_DIR}`, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr });
    res.json({ output: stdout });
  });
});

// FLAW: sensitive server info exposed — full directory listing with absolute paths
router.get('/files', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR).map(f => ({
      name: f,
      path: path.join(UPLOAD_DIR, f),
      size: fs.statSync(path.join(UPLOAD_DIR, f)).size,
    }));
    res.json({ uploadDir: UPLOAD_DIR, files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FLAW: SSRF — server makes HTTP request to any user-supplied URL
router.post('/fetch-url', (req, res) => {
  const { url } = req.body;
  // No allowlist — internal services reachable: http://localhost:6379, http://169.254.169.254 etc.
  const http  = url.startsWith('https') ? require('https') : require('http');
  http.get(url, (resp) => {
    let body = '';
    resp.on('data', d => { body += d; });
    resp.on('end', () => res.json({ status: resp.statusCode, body }));
  }).on('error', e => res.status(500).json({ error: e.message }));
});

// FLAW: ReDoS — catastrophic backtracking regex applied to user input
router.get('/validate-email', (req, res) => {
  const email = req.query.email || '';
  const vulnerable = /^([a-zA-Z0-9])(([a-zA-Z0-9])*([._-])*)*([a-zA-Z0-9])+@([a-zA-Z0-9])+(([-])*([a-zA-Z0-9])*)*([.][a-zA-Z]{2,4})+$/.test(email);
  res.json({ valid: vulnerable });
});

// FLAW: weak random token — Math.random() is not cryptographically secure
router.post('/generate-token', (req, res) => {
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  res.json({ token });
});

// FLAW: timing-safe comparison not used for secret key check
router.get('/internal', (req, res) => {
  const key = req.headers['x-internal-key'];
  // FLAW: == comparison leaks timing info; also key hardcoded
  if (key == 'internal-key-2024') {
    res.json({ secret: 'internal data', dbPath: process.env.DATABASE_URL });
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});

module.exports = router;
