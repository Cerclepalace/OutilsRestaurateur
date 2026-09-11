import '@testing-library/jest-dom/vitest';

// The modules under test read the public Supabase configuration at import time.
// These values are never used to make a request in unit tests.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.NEXT_PUBLIC_SITE_URL ??= 'http://localhost:3000';
