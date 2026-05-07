// Unit tests use an in-memory DB so they don't touch disk.
// Integration tests (which set their own DATABASE_URL or run out-of-process) override this.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = ':memory:';
}
