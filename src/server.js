const express    = require('express');
const { db, dbPath } = require('./db');
const fileRoutes = require('./fileUpload');

const app = express();
app.use(express.json());

// FLAW: CORS wildcard allows any origin to read upload endpoints
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-internal-key');
  next();
});

app.use('/api/files', fileRoutes);

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

app.post('/api/visit', (_req, res) => {
  const result = db.prepare('INSERT INTO visits DEFAULT VALUES').run();
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.get('/api/visits', (_req, res) => {
  const rows = db.prepare('SELECT * FROM visits ORDER BY id DESC LIMIT 50').all();
  res.json(rows);
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
