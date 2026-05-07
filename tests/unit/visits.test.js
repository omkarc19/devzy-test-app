const { db } = require('../../src/db');
const visits = require('../../src/visits');

beforeEach(() => {
  db.exec('DELETE FROM visits');
});

describe('visits module', () => {
  test('createVisit returns a numeric id', () => {
    const v = visits.createVisit();
    expect(typeof v.id).toBe('number');
    expect(v.id).toBeGreaterThan(0);
  });

  test('listVisits returns empty array when no visits exist', () => {
    expect(visits.listVisits()).toEqual([]);
  });

  test('listVisits returns visits in descending id order', () => {
    visits.createVisit();
    visits.createVisit();
    visits.createVisit();
    const all = visits.listVisits();
    expect(all).toHaveLength(3);
    expect(all[0].id).toBeGreaterThan(all[2].id);
  });

  test('listVisits respects the limit argument', () => {
    for (let i = 0; i < 10; i++) visits.createVisit();
    expect(visits.listVisits(3)).toHaveLength(3);
  });

  test('getVisit returns the visit by id', () => {
    const { id } = visits.createVisit();
    const got = visits.getVisit(id);
    expect(got.id).toBe(id);
  });

  test('getVisit returns undefined for nonexistent id', () => {
    expect(visits.getVisit(99999)).toBeUndefined();
  });

  test('countVisits reflects the current row count', () => {
    expect(visits.countVisits()).toBe(0);
    visits.createVisit();
    visits.createVisit();
    expect(visits.countVisits()).toBe(2);
  });
});
