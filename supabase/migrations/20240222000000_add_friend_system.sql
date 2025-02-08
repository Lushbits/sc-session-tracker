-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can create profiles"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    -- Only prevent duplicate pending requests between the same users
    CONSTRAINT unique_pending_friend_request UNIQUE (sender_id, receiver_id, status) WHERE (status = 'pending')
);

-- Create friends table (represents accepted friendships)
CREATE TABLE IF NOT EXISTS friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    -- Ensure we don't have duplicate friendships
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Set up Row Level Security (RLS)
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_requests
CREATE POLICY "Users can view their own sent or received friend requests"
    ON friend_requests FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create friend requests"
    ON friend_requests FOR INSERT
    WITH CHECK (auth.uid() = sender_id AND sender_id != receiver_id);

CREATE POLICY "Users can update friend requests they received"
    ON friend_requests FOR UPDATE
    USING (auth.uid() = receiver_id);

-- RLS Policies for friends
CREATE POLICY "Users can view their own friendships"
    ON friends FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "System can manage friendships"
    ON friends FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to handle friend request acceptance
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

-- Trigger for friend request acceptance
CREATE TRIGGER on_friend_request_accepted
    AFTER UPDATE ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_friend_request_accepted();

-- Function to handle friendship deletion
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

-- Trigger for friendship deletion
CREATE TRIGGER on_friendship_deleted
    AFTER DELETE ON friends
    FOR EACH ROW
    EXECUTE FUNCTION handle_friendship_deletion(); 