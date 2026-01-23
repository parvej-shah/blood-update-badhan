-- Row Level Security (RLS) Policies for Blood Donation Management System
-- Run these SQL commands in your Supabase SQL Editor

-- Enable RLS on the Donor table
ALTER TABLE "Donor" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (SELECT) from the Donor table
CREATE POLICY "Allow public read access" ON "Donor"
  FOR SELECT
  USING (true);

-- Allow anyone to insert (INSERT) into the Donor table
CREATE POLICY "Allow public insert access" ON "Donor"
  FOR INSERT
  WITH CHECK (true);

-- Optional: If you want to allow updates (not recommended for public access)
-- Uncomment the following if needed:
-- CREATE POLICY "Allow public update access" ON "Donor"
--   FOR UPDATE
--   USING (true)
--   WITH CHECK (true);

-- Optional: If you want to allow deletes (not recommended for public access)
-- Uncomment the following if needed:
-- CREATE POLICY "Allow public delete access" ON "Donor"
--   FOR DELETE
--   USING (true);

-- Note: UPDATE and DELETE policies are commented out by default for security.
-- Only enable them if you specifically need public write/delete access.

