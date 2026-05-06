const url = process.env.SANDBOX_URL;
if (!url) {
  console.error('SANDBOX_URL must be set');
  process.exit(2);
}

let failures = 0;
const test = async (name, fn) => {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures += 1;
    console.error(`  FAIL ${name}: ${e.message}`);
  }
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

(async () => {
  await test('GET /api/status returns ok', async () => {
    const r = await fetch(`${url}/api/status`);
    assert(r.ok, `status was ${r.status}`);
    const j = await r.json();
    assert(j.status === 'ok', `body.status was ${j.status}`);
  });

  await test('POST /api/visit then GET /api/visits returns the visit', async () => {
    const post = await fetch(`${url}/api/visit`, { method: 'POST' });
    assert(post.status === 201, `post status was ${post.status}`);
    const { id } = await post.json();
    assert(typeof id === 'number', 'visit id was not a number');

    const get = await fetch(`${url}/api/visits`);
    const visits = await get.json();
    assert(Array.isArray(visits), 'visits was not an array');
    assert(visits.some((v) => v.id === id), 'newly-created visit not in list');
  });

  if (failures > 0) {
    console.error(`\n${failures} test(s) failed`);
    process.exit(1);
  }
  console.log('\nall tests passed');
})();
