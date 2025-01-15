// IMPORTANT: This file should only be modified upon explicit user command.
// This prompt documents the functionality as of the current implementation.

# Balance Updates and Event List Functionality

## Balance Update Dialog
- When clicking "Update Balance", a dialog opens allowing input of a new balance
- The dialog calculates and displays the difference between current and new balance
- If balance increases:
  - Difference shown in green
  - Option to either:
    1. Record as earning by clicking one of the shown earning category buttons like Mining, Trading, Custom Earning etc. (creates earning event)
       - When Custom Earning is selected, the new balance field becomes locked
       - A new input field appears for entering the earning description
       - Only one event is created (earning event with the difference amount)
    2. Just update balance (creates balance adjustment event)
- If balance decreases:
  - Difference shown in red
  - Option to either:
    1. Record as spending by clicking one of the shown spending category buttons like Ship Purchase, Components, Custom Spend etc. (creates spend event)
       - When Custom Spend is selected, the new balance field becomes locked
       - A new input field appears for entering the spending description
       - Only one event is created (spending event with the absolute difference amount)
    2. Just update balance (creates balance adjustment event)

## Event List Display
- Events displayed in reverse chronological order (newest first)
- Each event shows:
  - Left side: Elapsed time since session start (HH:MM:SS)
  - Middle: Event details with appropriate coloring
  - Right side: Running balance after this event

### Event Types and Their Display Format
1. Spending Events
   - Format: "Spent X aUEC on [Category]" with spaces between elements
   - Word "Spent" in red text
   - Amount (X) in red text (this is the difference amount)
   - "aUEC" in red text
   - "on [Category]" in gray text
   - Running balance in gray text (this is event.amount)

2. Earning Events
   - Format: "Earned X aUEC from [Category]" with spaces between elements
   - Word "Earned" in green text
   - Amount (X) in green text (this is the difference amount)
   - "aUEC" in green text
   - "from [Category]" in gray text
   - Running balance in gray text (this is event.amount)

3. Balance Adjustments
   - Format: "Balance adjusted to X aUEC (±Y aUEC)"
   - "Balance adjusted to X aUEC" in cyan text (X is event.amount)
   - Difference (Y) in parentheses:
     - Positive difference in green with '+' prefix
     - Negative difference in red with '-' prefix
   - Running balance in gray text (this is event.amount)

4. Session Start
   - Format: "Starting balance: X aUEC"
   - Text in white (X is event.amount)
   - Running balance in gray text (this is event.amount)

5. Session End
   - Format: "Ending balance: X aUEC"
   - Text in white (X is event.amount)
   - Running balance in gray text (this is event.amount)

### Event Amount Consistency
For all event types, event.amount represents the total balance at the time of the event:
- For spending events: The new lower balance after the spending
- For earning events: The new higher balance after the earning
- For balance adjustments: The new balance value
- For session start: The initial balance
- For session end: The final balance

### Running Balance Calculation
- No calculation needed as each event stores its resulting balance in event.amount
- The running balance shown for each event is simply event.amount
- Always displayed with thousands separator (e.g., "100,000 aUEC")

## Event List Styling
- Horizontal dividers between events
- Hover effect: Light gray background
- Fixed-width time column (5rem)
- Consistent left alignment for all elements
- Proper vertical centering of all content

## Balance Calculations
- Running balance updated for each event:
  - Earnings: Add to previous balance
  - Spending: Subtract from previous balance
  - Balance adjustments: Set to new balance
- Session profit calculated from:
  - Total earnings (including positive balance adjustments)
  - Total spending (including negative balance adjustments)
  - Displayed in stats with color coding (green/red) 

Tooltip Display:
- Starting balance events: "HH:MM:SS - Starting balance: X aUEC" (amount in white)
- Ending balance events: "HH:MM:SS - Ending balance: X aUEC" (amount in white)
- Earning events: "HH:MM:SS - Earned X aUEC from [Category]" (amount and "Earned" in green, category in gray)
- Spending events: "HH:MM:SS - Spent X aUEC on [Category]" (amount and "Spent" in red, category in gray)
- Balance adjustment events: "HH:MM:SS - Balance adjusted to X aUEC (+/-Y aUEC)" (main text in cyan, difference in green/red)

Chart Interaction:
- Dots on the chart represent events:
  - Normal size: 6px radius
  - Hover size: 10px radius with white border
- Hovering over a dot highlights the corresponding event in the list view
- Hovering over a list item highlights the corresponding dot on the chart
- Tooltip appears when hovering over dots, showing event details with consistent formatting

Tooltip Styling:
- Semi-transparent card background with blur effect
- Consistent text colors matching the list view
- Shows event details on top and current balance at bottom
- Balance line shows "Balance: X aUEC" in gray 

### Event Amount and Display Logic
- event.amount always stores the total balance after the event
- For display purposes:
  - Earning events: Show difference (event.amount - previous balance) in the event text
  - Spending events: Show difference (previous balance - event.amount) in the event text
  - Balance adjustments: Show new total (event.amount) and difference in parentheses
  - Running balance (right side): Always show event.amount
  - Tooltip follows the same display logic as the list view 