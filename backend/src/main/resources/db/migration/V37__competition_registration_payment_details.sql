-- Migration V37: Add amount (rupees), currency, and signature_verified to competition_registrations
ALTER TABLE competition_registrations
    ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS signature_verified BOOLEAN DEFAULT FALSE;

-- Backfill amount (rupees) from amount_paise or parent competition registration_fee
UPDATE competition_registrations r
SET amount = CASE
    WHEN r.amount_paise IS NOT NULL THEN CAST(r.amount_paise AS NUMERIC(10, 2)) / 100.0
    ELSE COALESCE(c.registration_fee, 0.00)
END,
currency = COALESCE(r.currency, 'INR'),
signature_verified = CASE
    WHEN r.razorpay_signature IS NOT NULL AND TRIM(r.razorpay_signature) != '' THEN TRUE
    ELSE FALSE
END
FROM competitions c
WHERE r.competition_id = c.id
  AND (r.amount IS NULL OR r.amount = 0);

-- Ensure fallback defaults for any records
UPDATE competition_registrations
SET currency = 'INR'
WHERE currency IS NULL;

UPDATE competition_registrations
SET signature_verified = TRUE
WHERE razorpay_signature IS NOT NULL AND TRIM(razorpay_signature) != '' AND (signature_verified IS NULL OR signature_verified IS FALSE);
