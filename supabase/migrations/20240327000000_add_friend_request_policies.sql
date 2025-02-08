-- Drop existing policies first
drop policy if exists "Users can delete friend requests they're involved in" on friend_requests;
drop policy if exists "Users can insert friend requests" on friend_requests;
drop policy if exists "Users can update friend requests they received" on friend_requests;
drop policy if exists "Users can view friend requests they're involved in" on friend_requests;

-- Enable RLS on friend_requests table
alter table friend_requests enable row level security;

-- Policy for deleting friend requests (both sender and receiver can delete pending requests)
create policy "Users can delete friend requests they're involved in"
  on friend_requests
  for delete
  using (
    (auth.uid() = sender_id or auth.uid() = receiver_id)
    and status = 'pending'
  );

-- Policy for inserting friend requests
create policy "Users can insert friend requests"
  on friend_requests
  for insert
  with check (
    auth.uid() = sender_id
    and status = 'pending'
  );

-- Policy for updating friend requests (receiver can update status)
create policy "Users can update friend requests they received"
  on friend_requests
  for update
  using (
    auth.uid() = receiver_id
    and status = 'pending'
  )
  with check (
    auth.uid() = receiver_id
    and status in ('accepted', 'rejected')
  );

-- Policy for viewing friend requests
create policy "Users can view friend requests they're involved in"
  on friend_requests
  for select
  using (
    auth.uid() = sender_id
    or auth.uid() = receiver_id
  );

-- Policy for system functions to manage friend requests
create policy "System functions can manage friend requests"
  on friend_requests
  for all
  using (true)
  with check (true);

-- Make sure RLS is enabled on friends table
alter table friends enable row level security;

-- Policy for system functions to manage friendships
create policy "System functions can manage friendships"
  on friends
  for all
  using (true)
  with check (true); 