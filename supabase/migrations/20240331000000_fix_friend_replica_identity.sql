-- Set REPLICA IDENTITY to FULL for friends table to ensure DELETE events include old record data
ALTER TABLE friends REPLICA IDENTITY FULL;

-- Also set it for friend_requests table for consistency
ALTER TABLE friend_requests REPLICA IDENTITY FULL;

-- Ensure realtime is enabled for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE friends;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests; 