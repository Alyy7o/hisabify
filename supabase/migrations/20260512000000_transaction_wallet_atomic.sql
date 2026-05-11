-- Atomic wallet + transaction writes for Hisabify.
-- Apply in Supabase SQL Editor or via supabase db push.
-- If balances were still doubling after this migration, list triggers on public.transactions
-- and remove any legacy trigger that updates wallets.balance on INSERT/DELETE (the app RPCs handle balance).

CREATE OR REPLACE FUNCTION public.create_transaction_with_wallets(
  p_id uuid,
  p_wallet_id uuid,
  p_amount numeric,
  p_type text,
  p_category_id text,
  p_reason text,
  p_date timestamptz,
  p_notes text,
  p_to_wallet_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
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

  INSERT INTO public.transactions (id, user_id, wallet_id, amount, type, category_id, reason, date, notes)
  VALUES (p_id, v_uid, p_wallet_id, p_amount, p_type, p_category_id, p_reason, p_date, NULLIF(p_notes, ''));
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_transaction_with_wallet_reversal(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
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
    RAISE EXCEPTION 'Transaction not found';
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

  DELETE FROM public.transactions WHERE id = p_transaction_id AND user_id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_transaction_with_wallets(uuid, uuid, numeric, text, text, text, timestamptz, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_transaction_with_wallet_reversal(uuid) TO authenticated;
