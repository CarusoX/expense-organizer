-- Add end dates for fixed expense deactivation and versioning
-- end_month/end_year = the first month where the expense no longer appears
-- e.g., end_month=3, end_year=2026 means it shows through Feb 2026 only
ALTER TABLE expenses ADD COLUMN end_month INTEGER CHECK (end_month BETWEEN 1 AND 12);
ALTER TABLE expenses ADD COLUMN end_year INTEGER CHECK (end_year >= 2000);
