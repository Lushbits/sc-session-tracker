-- Drop the existing unique constraint
ALTER TABLE friend_requests
DROP CONSTRAINT IF EXISTS unique_friend_request;

-- Add the new constraint that only prevents duplicate pending requests
CREATE UNIQUE INDEX unique_pending_friend_request 
ON friend_requests (sender_id, receiver_id) 
WHERE status = 'pending';

-- Update the friendship deletion trigger to also clean up friend requests
CREATE OR REPLACE FUNCTION handle_friendship_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Set search path explicitly
    SET search_path = public, auth, extensions;
    
    -- Delete any existing friend requests between these users
    DELETE FROM friend_requests
    WHERE (sender_id = OLD.user_id AND receiver_id = OLD.friend_id)
       OR (sender_id = OLD.friend_id AND receiver_id = OLD.user_id);
    
    -- Delete the reciprocal friendship
    DELETE FROM friends
    WHERE (user_id = OLD.friend_id AND friend_id = OLD.user_id)
       OR (user_id = OLD.user_id AND friend_id = OLD.friend_id);
       
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public; 