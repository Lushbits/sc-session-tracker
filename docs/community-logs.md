# Community Logs Feature Implementation

## Overview
The Community Logs feature will allow users to share their Captain's Logs with the broader community. This document outlines the implementation details for this feature.

## Core Functionality

### 1. Making Logs Public ✅
- Users can mark any of their Captain's Logs as "public" from the Captain's Log page ✅
- A globe icon will be added next to the existing heart (favorite) icon ✅
- Clicking the globe icon will toggle the public status of the log ✅

### 2. Public Log Sharing (Partially Implemented) ⏳
- Each public log will have a unique shareable URL
- This URL can be copied and shared with anyone
- Non-logged-in users can view shared logs through these URLs
- Each shared log page will have a call-to-action (CTA) encouraging sign-up

### 3. Report System ✅
- Users can report inappropriate public logs ✅
- Reported logs will be flagged in the database ✅
- Reported logs will be hidden from general community view ✅
- Users can manually opt to see reported content ✅

## Database Changes

### Captain Logs Table Updates ✅
- Add `is_public` boolean field (default: false) ✅
- Add `reported_count` integer field (default: 0) ✅
- Add `is_hidden` boolean field (default: false) ✅

### New Report Logs Table ✅
```sql
CREATE TABLE public.log_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id UUID REFERENCES public.captain_logs(id) ON DELETE CASCADE,
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(log_id, reporter_user_id)
);
```

### Database Functions ✅
```sql
-- Function to increment the report count on a log
CREATE OR REPLACE FUNCTION increment_report_count(log_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get the current count
  SELECT reported_count INTO current_count
  FROM public.captain_logs
  WHERE id = log_id;
  
  -- Increment the count and update is_hidden if needed
  UPDATE public.captain_logs
  SET 
    reported_count = COALESCE(current_count, 0) + 1,
    is_hidden = CASE WHEN COALESCE(current_count, 0) + 1 >= 3 THEN TRUE ELSE is_hidden END
  WHERE id = log_id;
END;
$$;
```

## UI Components

### Captain's Log Card Updates ✅
- Add globe icon next to the heart icon ✅
- Implement toggle functionality for public status ✅
- Add visual indicator for public logs ✅

### Community Logs Page ✅
- Grid view of all public logs ✅
- Filtering options (recent, popular) ✅
- Toggle to show/hide reported content ✅
- Search functionality ✅

### Shareable Log View
- Public view for individual logs
- Metadata (author, date)
- Call-to-action for sign-up
- Report button for logged-in users

## Implementation Plan

### Phase 1: Database & Backend ✅
1. Update database schema to add public/reporting fields ✅
2. Create API endpoints for toggling public status ✅
3. Implement report functionality ✅
4. Create shareable URL structure and routing

### Phase 2: UI Implementation (In Progress) ⏳
1. Update Captain's Log Card component with public toggle ✅
2. Develop the Community Logs page ✅
3. Create the shareable log view for non-logged-in users
4. Add report UI components ✅

### Phase 3: Testing & Refinement
1. Test public sharing functionality
2. Verify report system works correctly
3. Optimize performance for community page
4. Add analytics to track engagement

## Security Considerations
- Ensure only the log owner can toggle public status ✅
- Implement rate limiting for the report system
- Add content moderation for reported logs
- Protect against spam and abuse

## Future Enhancements
- Comment system for public logs
- Like/upvote functionality
- Featured logs section
- User profiles showing public logs
- Follow system for favorite authors 