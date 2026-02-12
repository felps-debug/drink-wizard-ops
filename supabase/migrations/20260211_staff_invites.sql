-- Add email and status columns to support invitations
ALTER TABLE magodosdrinks_staff 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add check constraint for status
ALTER TABLE magodosdrinks_staff 
ADD CONSTRAINT check_staff_status CHECK (status IN ('active', 'pending'));

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_staff_email ON magodosdrinks_staff(email);
