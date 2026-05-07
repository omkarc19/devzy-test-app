const url = process.env.SANDBOX_URL;

const integrationTest = (name, fn) => {
  if (url) test(name, fn);
  else test.skip(`${name} (skipped: no SANDBOX_URL)`, fn);
};

describe('API integration (against running sandbox)', () => {
  integrationTest('GET /api/status returns ok', async () => {
    const r = await fetch(`${url}/api/status`);
    expect(r.ok).toBe(true);
    const j = await r.json();
    expect(j.status).toBe('ok');
  });

  integrationTest('full visit lifecycle: create, fetch, list', async () => {
    const created = await fetch(`${url}/api/visit`, { method: 'POST' });
    expect(created.status).toBe(201);
    const { id } = await created.json();
    expect(typeof id).toBe('number');

    const got = await fetch(`${url}/api/visit/${id}`);
    expect(got.ok).toBe(true);

    const list = await fetch(`${url}/api/visits`);
    const all = await list.json();
    expect(all.some((v) => v.id === id)).toBe(true);
  });

  integrationTest('user signup then login flow', async () => {
    const email = `test+${Date.now()}@example.com`;
    const sign = await fetch(`${url}/api/users`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    });
    expect(sign.status).toBe(201);

    const login = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    });
    expect(login.ok).toBe(true);
    const { token, user } = await login.json();
    expect(typeof token).toBe('string');
    expect(user.email).toBe(email);
  });

  integrationTest('login fails with wrong password', async () => {
    const email = `test+${Date.now()}@example.com`;
    await fetch(`${url}/api/users`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    });
    const login = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrong' }),
    });
    expect(login.status).toBe(401);
  });
});
