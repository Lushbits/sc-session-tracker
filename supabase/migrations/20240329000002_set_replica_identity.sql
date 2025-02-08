-- Set replica identity for realtime delete operations
ALTER TABLE friends REPLICA IDENTITY FULL;
ALTER TABLE friend_requests REPLICA IDENTITY FULL; 