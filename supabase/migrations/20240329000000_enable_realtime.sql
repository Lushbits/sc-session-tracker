-- Enable realtime for friend system tables
alter publication supabase_realtime add table friends;
alter publication supabase_realtime add table friend_requests; 