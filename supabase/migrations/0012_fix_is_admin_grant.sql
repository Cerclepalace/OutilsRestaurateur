-- =============================================================================
-- BOBO PARIS — 0012 Restore anon EXECUTE on is_admin()
--
-- 0010 revoked EXECUTE from `anon` to keep the function off the public REST
-- surface. That broke every anonymous read: the admin RLS policies call
-- is_admin(), and Postgres evaluates all permissive policies for a role, so an
-- anonymous SELECT on `products` failed with "permission denied for function
-- is_admin" rather than falling through to the public-read policy.
--
-- The grant is restored. It leaks nothing: for an anonymous caller auth.uid()
-- is null, so the function can only ever answer false about that same caller.
-- =============================================================================

grant execute on function public.is_admin() to anon, authenticated;
