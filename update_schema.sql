-- Remove the old constraint
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_type_check;

-- Add the new constraint including 'digital_wallet'
ALTER TABLE wallets ADD CONSTRAINT wallets_type_check 
  CHECK (type IN ('bank', 'cash', 'card', 'savings', 'digital_wallet'));
