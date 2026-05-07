const { db } = require('./db');

const createVisit = () => {
  const r = db.prepare('INSERT INTO visits DEFAULT VALUES').run();
  return { id: Number(r.lastInsertRowid) };
};

const listVisits = (limit = 50) =>
  db.prepare('SELECT * FROM visits ORDER BY id DESC LIMIT ?').all(limit);

const getVisit = (id) =>
  db.prepare('SELECT * FROM visits WHERE id = ?').get(id);

const countVisits = () =>
  db.prepare('SELECT COUNT(*) as n FROM visits').get().n;

module.exports = { createVisit, listVisits, getVisit, countVisits };
