-- Function to get sessions created per day
CREATE OR REPLACE FUNCTION get_sessions_per_day()
RETURNS TABLE (
  date text,
  count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
    COUNT(*) as count
  FROM sessions
  GROUP BY DATE_TRUNC('day', created_at)
  ORDER BY DATE_TRUNC('day', created_at) ASC;
$$;

-- Function to get cumulative user signups over time
CREATE OR REPLACE FUNCTION get_user_signups_over_time()
RETURNS TABLE (
  date text,
  count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  WITH daily_signups AS (
    SELECT 
      DATE_TRUNC('day', created_at) as signup_date,
      COUNT(*) as signup_count
    FROM auth.users
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY DATE_TRUNC('day', created_at)
  )
  SELECT 
    TO_CHAR(s.signup_date, 'YYYY-MM-DD') as date,
    SUM(signup_count) OVER (ORDER BY s.signup_date) as count
  FROM daily_signups s
  ORDER BY s.signup_date;
$$;

-- Function to get top users by sessions created
CREATE OR REPLACE FUNCTION get_top_session_creators(limit_num int DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COUNT(s.id) as count
  FROM profiles p
  LEFT JOIN sessions s ON p.user_id = s.user_id
  GROUP BY p.user_id, p.username, p.display_name, p.avatar_url
  ORDER BY COUNT(s.id) DESC
  LIMIT limit_num;
$$;

-- Function to get top users by logs created
CREATE OR REPLACE FUNCTION get_top_log_creators(limit_num int DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COUNT(l.id) as count
  FROM profiles p
  LEFT JOIN captain_logs l ON p.user_id = l.user_id
  GROUP BY p.user_id, p.username, p.display_name, p.avatar_url
  ORDER BY COUNT(l.id) DESC
  LIMIT limit_num;
$$;

-- Function to get log stats (total and public)
CREATE OR REPLACE FUNCTION get_log_stats()
RETURNS TABLE (
  total bigint,
  public bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_public = true) as public
  FROM captain_logs;
$$; 