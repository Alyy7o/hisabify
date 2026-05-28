-- Run this if wallet balance still changes 2x per transaction.
-- Causes: legacy triggers on public.transactions also update wallets.balance.
-- Fix: SECURITY DEFINER RPCs disable USER triggers during insert/delete; receipt_url on insert (no UPDATE).

DROP FUNCTION IF EXISTS public.create_transaction_with_wallets(
  uuid, uuid, numeric, text, text, text, timestamptz, text, uuid
);

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'transactions'
      AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.transactions', r.tgname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.create_transaction_with_wallets(
  p_id uuid,
  p_wallet_id uuid,
  p_amount numeric,
  p_type text,
  p_category_id text,
  p_reason text,
  p_date timestamptz,
  p_notes text,
  p_to_wallet_id uuid DEFAULT NULL,
  p_receipt_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF p_type NOT IN ('income', 'expense') THEN
    RAISE EXCEPTION 'Invalid transaction type';
  END IF;

  IF EXISTS (SELECT 1 FROM public.transactions WHERE id = p_id AND user_id = v_uid) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = p_wallet_id AND w.user_id = v_uid) THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF p_to_wallet_id IS NOT NULL THEN
    IF p_to_wallet_id = p_wallet_id THEN
      RAISE EXCEPTION 'Transfer requires distinct wallets';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = p_to_wallet_id AND w.user_id = v_uid) THEN
      RAISE EXCEPTION 'Destination wallet not found';
    END IF;
    UPDATE public.wallets SET balance = balance - p_amount WHERE id = p_wallet_id AND user_id = v_uid;
    UPDATE public.wallets SET balance = balance + p_amount WHERE id = p_to_wallet_id AND user_id = v_uid;
  ELSIF p_type = 'income' THEN
    UPDATE public.wallets SET balance = balance + p_amount WHERE id = p_wallet_id AND user_id = v_uid;
  ELSE
    UPDATE public.wallets SET balance = balance - p_amount WHERE id = p_wallet_id AND user_id = v_uid;
  END IF;

  ALTER TABLE public.transactions DISABLE TRIGGER USER;

  INSERT INTO public.transactions (
    id, user_id, wallet_id, amount, type, category_id, reason, date, notes, receipt_url
  )
  VALUES (
    p_id, v_uid, p_wallet_id, p_amount, p_type, p_category_id, p_reason, p_date,
    NULLIF(p_notes, ''), NULLIF(p_receipt_url, '')
  );

  ALTER TABLE public.transactions ENABLE TRIGGER USER;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_transaction_with_wallet_reversal(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  t record;
  m text[];
  dest_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO t
  FROM public.transactions
  WHERE id = p_transaction_id AND user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  dest_id := NULL;
  IF t.notes IS NOT NULL THEN
    m := regexp_match(t.notes, '\[DEST:([0-9a-f-]{36})\]');
    IF m IS NOT NULL THEN
      dest_id := m[1]::uuid;
    END IF;
  END IF;

  IF dest_id IS NULL AND t.category_id IS NOT NULL THEN
    m := regexp_match(t.category_id, '_transfer_([0-9a-f-]{36})$');
    IF m IS NOT NULL THEN
      dest_id := m[1]::uuid;
    END IF;
  END IF;

  IF dest_id IS NOT NULL AND t.type = 'expense' THEN
    UPDATE public.wallets SET balance = balance + t.amount WHERE id = t.wallet_id AND user_id = v_uid;
    UPDATE public.wallets SET balance = balance - t.amount WHERE id = dest_id AND user_id = v_uid;
  ELSIF t.type = 'income' THEN
    UPDATE public.wallets SET balance = balance - t.amount WHERE id = t.wallet_id AND user_id = v_uid;
  ELSE
    UPDATE public.wallets SET balance = balance + t.amount WHERE id = t.wallet_id AND user_id = v_uid;
  END IF;

  ALTER TABLE public.transactions DISABLE TRIGGER USER;
  DELETE FROM public.transactions WHERE id = p_transaction_id AND user_id = v_uid;
  ALTER TABLE public.transactions ENABLE TRIGGER USER;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_transaction_with_wallets(
  uuid, uuid, numeric, text, text, text, timestamptz, text, uuid, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.delete_transaction_with_wallet_reversal(uuid) TO authenticated;
