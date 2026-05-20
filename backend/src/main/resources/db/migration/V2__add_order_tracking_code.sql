CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(64);

UPDATE orders
SET tracking_code = encode(gen_random_bytes(16), 'hex')
WHERE tracking_code IS NULL;

ALTER TABLE orders ALTER COLUMN tracking_code SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uk_orders_tracking_code'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT uk_orders_tracking_code UNIQUE (tracking_code);
    END IF;
END $$;
