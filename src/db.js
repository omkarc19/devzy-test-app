const Database = require('better-sqlite3');

const raw = process.env.DATABASE_URL || 'data.sqlite';
const dbPath = raw.replace(/^file:/, '');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY,
    at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = { db, dbPath };
