# Dynamic Friend Request Functionality Specification

## NEVER SEARCH FOR USERS BY USERNAME OR EXPOSE THEM IN THE CODE OR TO OTHER USERS. ONLY USE DISPLAY NAME.

<!-- 
  This document outlines the real-time UI update logic for friend request interactions
  using Supabase (for real-time data) and React with TypeScript (via Vite).
-->

## Overview
<!-- 
This specification covers dynamic UI behavior for the following friend request actions:
- Sending a Request
- Rejecting a Request
- Cancelling a Request
- Accepting a Request
-->

## 1. Sending a Request
<!-- 
- **Sender UI:** Immediately display the new request in the "Sent Requests" list.
- **Recipient UI:** Instantly show the new incoming request in the "Incoming Requests" list.
-->

## 2. Rejecting a Request
<!-- 
- **Recipient UI:** Remove the rejected request from the "Incoming Requests" list.
- **Sender UI:** Automatically remove the corresponding entry from the "Sent Requests" list.
-->

## 3. Cancelling a Request
<!-- 
- **Sender UI:** Remove the canceled request from the "Sent Requests" list.
- **Recipient UI:** Remove the canceled request from the "Incoming Requests" list.
-->

## 4. Accepting a Request
<!-- 
- **Both UIs:**
  - Remove the request from the sender’s "Sent Requests" list.
  - Remove the request from the recipient’s "Incoming Requests" list.
  - Immediately add the new friend to both users' "My Friends" lists.
-->

## Real-Time Synchronization Strategy
<!-- 
- **Supabase Realtime Subscriptions:**  
  Utilize Supabase's built-in real-time features to subscribe to updates on friend request records relevant to each user.
  
- **React State Management:**  
  Use React hooks (e.g., `useEffect` and `useState`) to update UI components as events are received, ensuring that the "Sent Requests," "Incoming Requests," and "My Friends" lists remain current.

- **Error Handling & Resilience:**  
  Implement reconnection strategies for real-time subscriptions to handle network interruptions. On reconnection, sync any missed updates to maintain state consistency.
-->

## Conclusion
<!-- 
By leveraging Supabase's real-time capabilities and React's reactive state management, friend request actions (sending, rejecting, cancelling, and accepting) will update dynamically in both sender and recipient UIs, ensuring a seamless, responsive user experience.
-->
