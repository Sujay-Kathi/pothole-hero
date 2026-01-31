-- Create admin_credentials table for storing admin login credentials
-- Password is stored in plain text for easy database management

CREATE TABLE IF NOT EXISTS admin_credentials (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin credentials
INSERT INTO admin_credentials (username, password, is_active)
VALUES ('admin', 'potholehero@123', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Enable RLS but allow public read for login verification
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to check credentials (read-only for login)
CREATE POLICY "Allow public to read admin credentials for login"
    ON admin_credentials
    FOR SELECT
    USING (true);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_credentials_timestamp
    BEFORE UPDATE ON admin_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_credentials_updated_at();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_credentials_username ON admin_credentials(username);

COMMENT ON TABLE admin_credentials IS 'Stores admin login credentials for the Pothole Hero app';
COMMENT ON COLUMN admin_credentials.username IS 'Admin username for login';
COMMENT ON COLUMN admin_credentials.password IS 'Admin password (plain text for easy management)';
COMMENT ON COLUMN admin_credentials.is_active IS 'Whether this admin account is active';
