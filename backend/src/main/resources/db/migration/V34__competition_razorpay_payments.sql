-- Migration V34: Add Razorpay payment fields to competition_registrations
-- Safe on existing data with backward compatibility

ALTER TABLE competition_registrations
    ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255),
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS amount_paise BIGINT;

-- Backfill amount_paise for any existing paid records from parent competition registration_fee
UPDATE competition_registrations r
SET amount_paise = CAST(ROUND(COALESCE(c.registration_fee, 0) * 100) AS BIGINT)
FROM competitions c
WHERE r.competition_id = c.id
  AND (LOWER(r.payment_status) = 'paid' OR r.payment_status = 'PAID')
  AND r.amount_paise IS NULL;

-- Backfill paid_at for existing paid records if null
UPDATE competition_registrations
SET paid_at = created_at
WHERE (LOWER(payment_status) = 'paid' OR payment_status = 'PAID')
  AND paid_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_comp_reg_razorpay_order ON competition_registrations(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_comp_reg_payment_status ON competition_registrations(payment_status);
