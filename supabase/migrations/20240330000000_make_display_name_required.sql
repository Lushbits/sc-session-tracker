-- Update any existing NULL display_names to use username
UPDATE profiles
SET display_name = username
WHERE display_name IS NULL;

-- Make display_name NOT NULL
ALTER TABLE profiles
ALTER COLUMN display_name SET NOT NULL;

-- Add a trigger to ensure display_name is never NULL
CREATE OR REPLACE FUNCTION ensure_display_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_name IS NULL THEN
        NEW.display_name := NEW.username;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_display_name_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_display_name(); 