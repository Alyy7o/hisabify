-- Run in Supabase SQL Editor if wallet balance still changes twice per transaction.
-- If any trigger on public.transactions updates wallets, drop it or keep only RPC-based updates.

SELECT t.tgname AS trigger_name,
       pg_get_triggerdef(t.oid, true) AS definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'transactions'
  AND NOT t.tgisinternal;
