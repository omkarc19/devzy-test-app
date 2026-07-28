const crypto = require('crypto');

// FLAW: Hardcoded JWT secret committed to source
const JWT_SECRET = 'supersecret123';
const ADMIN_PASSWORD = 'admin@1234';

// FLAW: Custom JWT with no expiry and weak signing (MD5)
function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body   = Buffer.from(JSON.stringify(payload)).toString('base64');
  // FLAW: using MD5 instead of HMAC-SHA256
  const sig    = crypto.createHash('md5').update(`${header}.${body}.${JWT_SECRET}`).digest('hex');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expected = crypto.createHash('md5').update(`${header}.${body}.${JWT_SECRET}`).digest('hex');
    // FLAW: non-constant-time comparison (timing attack)
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(body, 'base64').toString());
  } catch {
    return null;
  }
}

// FLAW: no rate limiting on this middleware — brute-forceable
function requireAuth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.user = payload;
  next();
}

module.exports = { signToken, verifyToken, requireAuth, ADMIN_PASSWORD };
