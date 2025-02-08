-- First check if publication exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE friends;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;

-- Ensure replica identity is set for realtime delete operations
ALTER TABLE friends REPLICA IDENTITY FULL;
ALTER TABLE friend_requests REPLICA IDENTITY FULL; 