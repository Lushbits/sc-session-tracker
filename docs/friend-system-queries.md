# Friend System Query Solution

## Key Points
1. The correct way to join tables in Supabase queries uses the following syntax:
   - `friend:profiles!friend_id(...)` instead of `profiles!friends_friend_id_fkey(...)`
   - The format is `alias:table!foreign_key(fields)`

## Working Queries

### 1. Fetch Friends
```sql
.from('friends')
.select(`
  id,
  user_id,
  friend_id,
  friend:profiles!friend_id(
    id,
    user_id,
    username,
    display_name,
    avatar_url,
    created_at,
    updated_at
  )
`)
```

### 2. Fetch Received Requests
```sql
.from('friend_requests')
.select(`
  id,
  sender_id,
  receiver_id,
  status,
  created_at,
  updated_at,
  sender:profiles!sender_id(
    id,
    user_id,
    username,
    display_name,
    avatar_url,
    created_at,
    updated_at
  )
`)
```

### 3. Fetch Sent Requests
```sql
.from('friend_requests')
.select(`
  id,
  sender_id,
  receiver_id,
  status,
  created_at,
  updated_at,
  receiver:profiles!receiver_id(
    id,
    user_id,
    username,
    display_name,
    avatar_url,
    created_at,
    updated_at
  )
`)
```

## Data Mapping
After fetching, the data needs to be mapped correctly:
```typescript
// For friends
const mappedFriends = (friendsData || []).map(friend => {
  const profile = friend.friend as unknown as Profile
  return {
    id: profile.id,
    user_id: friend.friend_id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  } as Profile
})

// For requests
const mappedRequests = (requestsData || []).map(request => {
  const profile = request.sender/receiver as unknown as Profile
  return {
    ...request,
    sender/receiver: profile
  } as FriendRequest
})
```

## Important Notes
1. The foreign key names in the query must match the actual foreign key constraints in the database
2. The alias names (friend, sender, receiver) must match what you use in the data mapping
3. TypeScript type assertions are needed to handle the Supabase response types

## Database Schema Requirements
Make sure these foreign key relationships exist in the database:
1. `friends.friend_id` references `profiles.user_id`
2. `friend_requests.sender_id` references `profiles.user_id`
3. `friend_requests.receiver_id` references `profiles.user_id`

## TypeScript Interfaces
```typescript
interface Profile {
  id: string
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  sender?: Profile
  receiver?: Profile
}
``` 