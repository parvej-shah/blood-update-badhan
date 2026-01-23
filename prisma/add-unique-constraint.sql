-- Add unique constraint to prevent duplicate entries
-- Run this SQL in your Supabase SQL Editor

-- First, remove any existing duplicates (keep the oldest one)
-- This finds duplicates based on phone, date, and name (case-insensitive)
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY phone, date, LOWER(TRIM(name))
      ORDER BY "createdAt" ASC
    ) as row_num
  FROM "Donor"
)
DELETE FROM "Donor"
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Add unique constraint (case-sensitive, but application handles case-insensitive check)
DO $$ 
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'Donor_phone_date_name_key'
    ) THEN
        ALTER TABLE "Donor" 
        ADD CONSTRAINT "Donor_phone_date_name_key" 
        UNIQUE (phone, date, name);
        
        RAISE NOTICE 'Unique constraint added successfully';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;

