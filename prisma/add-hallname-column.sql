-- Add hallName column to Donor table
-- Run this SQL in your Supabase SQL Editor

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Donor' 
        AND column_name = 'hallName'
    ) THEN
        ALTER TABLE "Donor" 
        ADD COLUMN "hallName" TEXT;
        
        RAISE NOTICE 'Column hallName added successfully';
    ELSE
        RAISE NOTICE 'Column hallName already exists';
    END IF;
END $$;

