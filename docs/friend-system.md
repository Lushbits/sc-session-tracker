# Friend System Documentation

## Overview
The friend system is a real-time enabled feature that allows users to:
- Send friend requests
- Accept/reject incoming friend requests
- View their friends list
- Remove friends
- Search for other users
- Get real-time notifications for friend requests

## Database Schema

### Tables

#### 1. profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

#### 2. friend_requests
```sql
CREATE TABLE friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT unique_pending_friend_request UNIQUE (sender_id, receiver_id, status) WHERE (status = 'pending')
);
```

#### 3. friends
```sql
CREATE TABLE friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);
```

### Database Functions and Triggers

#### Friend Request Acceptance Handler
```sql
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
    SET search_path = public, auth, extensions;
    
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
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

CREATE TRIGGER on_friend_request_accepted
    AFTER UPDATE ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_friend_request_accepted();
```

#### Friendship Deletion Handler
```sql
CREATE OR REPLACE FUNCTION handle_friendship_deletion()
RETURNS TRIGGER AS $$
BEGIN
    SET search_path = public, auth, extensions;
    
    -- Delete any existing friend requests
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

CREATE TRIGGER on_friendship_deleted
    AFTER DELETE ON friends
    FOR EACH ROW
    EXECUTE FUNCTION handle_friendship_deletion();
```

### Row Level Security (RLS) Policies

#### Profiles
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create profiles"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### Friend Requests
```sql
-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view friend requests they're involved in"
    ON friend_requests FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create friend requests"
    ON friend_requests FOR INSERT
    WITH CHECK (auth.uid() = sender_id AND status = 'pending');

CREATE POLICY "Users can update friend requests they received"
    ON friend_requests FOR UPDATE
    USING (auth.uid() = receiver_id AND status = 'pending')
    WITH CHECK (auth.uid() = receiver_id AND status in ('accepted', 'rejected'));

CREATE POLICY "Users can delete friend requests they're involved in"
    ON friend_requests FOR DELETE
    USING ((auth.uid() = sender_id OR auth.uid() = receiver_id) AND status = 'pending');
```

#### Friends
```sql
-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own friendships"
    ON friends FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "System can manage friendships"
    ON friends FOR ALL
    USING (true)
    WITH CHECK (true);
```

## Realtime Setup

### Enable Realtime
```sql
-- Enable realtime for friend system tables
ALTER PUBLICATION supabase_realtime ADD TABLE friends;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;

-- Set replica identity for realtime delete operations
ALTER TABLE friends REPLICA IDENTITY FULL;
ALTER TABLE friend_requests REPLICA IDENTITY FULL;
```

### Realtime Subscription Setup
The realtime functionality is implemented in `src/lib/friend-system-realtime.ts`. The key components are:

1. State Interface:
```typescript
interface FriendSystemState {
  friends: Profile[]
  incomingRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  setFriends: (friends: Profile[] | ((prev: Profile[]) => Profile[])) => void
  setIncomingRequests: (requests: FriendRequest[] | ((prev: FriendRequest[]) => FriendRequest[])) => void
  setSentRequests: (requests: FriendRequest[] | ((prev: FriendRequest[]) => FriendRequest[])) => void
}
```

2. Subscription Function:
```typescript
export const setupFriendRequestSubscription = (
  channel: RealtimeChannel,
  state: FriendSystemState,
  userId: string
): (() => void) => {
  // Initial data sync
  syncFriendData(state, userId)

  // Set up channel listeners for friend_requests and friends tables
  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, ...)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, ...)

  // Return cleanup function
  return () => channel.unsubscribe()
}
```

## UI Components

### Key Components

1. `FriendSearch`: Search for users and send friend requests
2. `FriendRequests`: Display and manage incoming friend requests
3. `FriendsList`: Display current friends and manage friendships
4. `NotificationBell`: Real-time notification for friend requests
5. `ProfileDialog`: User profile management

### Context Setup

The friend system is managed through the `FriendContext` (`src/contexts/FriendContext.tsx`) which provides:

```typescript
interface FriendContextType {
  friends: Profile[]
  pendingRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  loading: boolean
  error: Error | null
  searchUsers: (query: string) => Promise<Profile[]>
  sendFriendRequest: (userId: string) => Promise<void>
  acceptFriendRequest: (requestId: string) => Promise<void>
  rejectFriendRequest: (requestId: string) => Promise<void>
  cancelFriendRequest: (requestId: string) => Promise<void>
  removeFriend: (friendId: string) => Promise<void>
  getLoadingState: (operation: string, id: string) => boolean
}
```

## Database Queries

### Key Queries

1. Search Profiles:
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select()
  .neq('user_id', currentUserId)
  .ilike('username', `%${searchTerm}%`)
  .limit(5);
```

2. Fetch Friend Requests:
```typescript
const { data, error } = await supabase
  .from('friend_requests')
  .select(`
    *,
    sender:profiles!sender_id(*),
    receiver:profiles!receiver_id(*)
  `)
  .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
```

3. Fetch Friends:
```typescript
const { data, error } = await supabase
  .from('friends')
  .select(`
    id,
    user_id,
    friend_id,
    friend:profiles!friend_id(*)
  `)
  .eq('user_id', userId)
```

## Error Handling

1. Database Constraints:
   - Unique pending requests between users
   - Unique friendships
   - Required display names
   - Proper foreign key relationships

2. UI Error States:
   - Loading indicators for all actions
   - Error messages for failed operations
   - Proper disabled states during operations

## Maintenance Notes

1. When modifying the friend system:
   - Ensure RLS policies are properly set
   - Maintain bidirectional friendship records
   - Keep realtime subscriptions efficient
   - Handle cleanup properly in components

2. Common Issues:
   - If realtime not working, check REPLICA IDENTITY settings
   - If friend requests fail, check RLS policies
   - If UI not updating, check subscription setup

3. Performance Considerations:
   - Use proper indexes on frequently queried columns
   - Keep subscription payloads minimal
   - Implement proper cleanup for realtime subscriptions 