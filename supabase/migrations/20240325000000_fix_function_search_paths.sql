-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS on_friendship_deleted ON friends;
DROP TRIGGER IF EXISTS on_friend_request_accepted ON friend_requests;
DROP FUNCTION IF EXISTS handle_friendship_deletion();
DROP FUNCTION IF EXISTS handle_friend_request_accepted();

-- Recreate function for handling friend request acceptance with proper search path
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
    -- Set search path explicitly
    SET search_path = public, auth, extensions;
    
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Create bidirectional friendship records
        INSERT INTO friends (user_id, friend_id)
        VALUES 
            (NEW.sender_id, NEW.receiver_id),
            (NEW.receiver_id, NEW.sender_id)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Recreate trigger for friend request acceptance
CREATE TRIGGER on_friend_request_accepted
    AFTER UPDATE ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_friend_request_accepted();

-- Recreate function for handling friendship deletion with proper search path
CREATE OR REPLACE FUNCTION handle_friendship_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Set search path explicitly
    SET search_path = public, auth, extensions;
    
    -- Delete the reciprocal friendship
    DELETE FROM friends
    WHERE (user_id = OLD.friend_id AND friend_id = OLD.user_id)
       OR (user_id = OLD.user_id AND friend_id = OLD.friend_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Recreate trigger for friendship deletion
CREATE TRIGGER on_friendship_deleted
    AFTER DELETE ON friends
    FOR EACH ROW
    EXECUTE FUNCTION handle_friendship_deletion(); 