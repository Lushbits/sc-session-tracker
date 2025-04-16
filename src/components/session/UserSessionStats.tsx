import { Session } from '../../types';
import { useMemo } from 'react';
import { formatNumber } from '../../utils/numberFormatting';

interface UserSessionStatsProps {
  sessions: Session[];
}

/**
 * Calculates the profit for a single session based on its events.
 * Profit is defined as total earnings minus total spendings.
 * @param session - The session object.
 * @returns The calculated profit for the session.
 */
const calculateSessionProfit = (session: Session): number => {
  let profit = 0;
  session.events.forEach(event => {
    // Accumulate earnings
    if (event.type === 'earning') {
      profit += event.amount;
    } 
    // Subtract spendings
    else if (event.type === 'spending') {
      profit -= event.amount;
    }
    // Note: 'balance-update' events do not directly contribute to profit/loss in this calculation.
  });
  return profit;
};

/**
 * Formats a duration given in milliseconds into a human-readable string (e.g., "X hours Y minutes").
 * @param ms - Duration in milliseconds.
 * @returns Formatted duration string.
 */
const formatPlaytime = (ms: number): string => {
  if (ms <= 0) return '0 minutes';
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  let result = '';
  if (hours > 0) {
    result += `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    if (result) result += ' '; // Add space if hours are also present
    result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  // Handle cases where duration is less than a minute but non-zero
  if (!result && totalSeconds > 0) {
      return '< 1 minute';
  }

  return result || '0 minutes'; // Fallback if calculation results in empty string
};

/**
 * A component to display overall statistics calculated from a user's completed sessions.
 */
export function UserSessionStats({ sessions }: UserSessionStatsProps) {
  // Calculate statistics using useMemo for performance.
  // Recalculates only when the sessions array changes.
  const stats = useMemo(() => {
    // Filter sessions to include only those that have an end time (completed sessions).
    const completedSessions = sessions.filter(s => s.endTime);
    const totalSessions = completedSessions.length;

    // If there are no completed sessions, return default zero values.
    if (totalSessions === 0) {
      return {
        totalSessions: 0,
        totalPlaytimeMs: 0,
        averageProfitPerSession: 0,
        averageProfitPerHour: 0,
        averageDurationMs: 0,
      };
    }

    let totalProfit = 0;
    let totalPlaytimeMs = 0;

    // Iterate over completed sessions to calculate total profit and playtime.
    completedSessions.forEach(session => {
      // Ensure endTime exists before calculating duration (TypeScript type guard helps here).
      if (session.endTime) {
        const durationMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
        // Add to total playtime.
        totalPlaytimeMs += durationMs > 0 ? durationMs : 0; // Ensure duration is not negative
        
        // Calculate profit for this session and add to total profit.
        totalProfit += calculateSessionProfit(session);
      }
    });

    // Calculate total playtime in hours for the per-hour calculation.
    const totalPlaytimeHours = totalPlaytimeMs / (1000 * 60 * 60);

    // Calculate averages, handling potential division by zero.
    const averageProfitPerSession = totalProfit / totalSessions;
    const averageProfitPerHour = totalPlaytimeHours > 0 ? totalProfit / totalPlaytimeHours : 0;
    // Calculate average duration
    const averageDurationMs = totalSessions > 0 ? totalPlaytimeMs / totalSessions : 0;

    return {
      totalSessions,
      totalPlaytimeMs,
      averageProfitPerSession,
      averageProfitPerHour,
      averageDurationMs,
    };
  }, [sessions]); // Dependency array ensures recalculation only when sessions change.

  // Conditional class for profit text color (green for positive, red for negative)
  const profitClass = (value: number) => value >= 0 ? 'text-[hsl(var(--event-earning))]' : 'text-[hsl(var(--event-spending))]';
  // Prefix profit with '+' if positive
  const profitPrefix = (value: number) => value > 0 ? '+' : '';

  return (
    // Outer container for the stats section - Use new class, removed p-[1px]
    <div className="gradient-border-box mb-6 bg-card border-border rounded-lg shadow-sm">
      {/* Inner container to hold content and apply original padding/background */}
      {/* Note: border-border class removed from outer div in CSS now */}
      <div className="inner-content p-3 sm:p-4 bg-card rounded-[7px]">
        {/* Reduced bottom margin */}
        <h2 className="text-lg font-semibold mb-3">Overall Session Stats</h2>
        {/* Display a message if there are no completed sessions */}
        {stats.totalSessions === 0 ? (
           <p className="text-muted-foreground text-center py-4">No completed sessions to calculate stats from.</p>
        ) : (
          // Grid layout for the stat cards, responsive columns - adjusted to 5 columns on large screens
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
            {/* Stat Card: Total Sessions - reduced padding */}
            <div className="p-2 sm:p-3 bg-background rounded-md border border-border/50">
              {/* Reduced font size and bottom margin */}
              <p className="text-xs text-muted-foreground mb-0.5">Completed Sessions</p>
              {/* Changed font size to text-base */}
              <p className="text-base font-bold">{stats.totalSessions}</p>
            </div>

            {/* Stat Card: Total Playtime - reduced padding */}
            <div className="p-2 sm:p-3 bg-background rounded-md border border-border/50">
               {/* Reduced font size and bottom margin */}
              <p className="text-xs text-muted-foreground mb-0.5">Total Playtime</p>
               {/* Changed font size to text-base */}
              <p className="text-base font-bold">{formatPlaytime(stats.totalPlaytimeMs)}</p>
            </div>

            {/* Stat Card: Avg Profit / Session - reduced padding */}
            <div className="p-2 sm:p-3 bg-background rounded-md border border-border/50">
               {/* Reduced font size and bottom margin */}
              <p className="text-xs text-muted-foreground mb-0.5">Avg. Profit / Session</p>
               {/* Changed font size to text-base */}
              <p className={`text-base font-bold ${profitClass(stats.averageProfitPerSession)}`}>
                {/* Round the value before formatting */}
                {profitPrefix(stats.averageProfitPerSession)}{formatNumber(Math.round(stats.averageProfitPerSession))} aUEC
              </p>
            </div>

            {/* Stat Card: Avg Profit / Hour - reduced padding */}
            <div className="p-2 sm:p-3 bg-background rounded-md border border-border/50">
               {/* Reduced font size and bottom margin */}
              <p className="text-xs text-muted-foreground mb-0.5">Avg. Profit / Hour</p>
                {/* Changed font size to text-base */}
               <p className={`text-base font-bold ${profitClass(stats.averageProfitPerHour)}`}>
                 {/* Round the value before formatting */}
                 {profitPrefix(stats.averageProfitPerHour)}{formatNumber(Math.round(stats.averageProfitPerHour))} aUEC
               </p>
            </div>
            
            {/* Stat Card: Avg Session Duration - New Card */}
            <div className="p-2 sm:p-3 bg-background rounded-md border border-border/50">
              <p className="text-xs text-muted-foreground mb-0.5">Avg. Session Duration</p>
              {/* Changed font size to text-base */}
              <p className="text-base font-bold">{formatPlaytime(stats.averageDurationMs)}</p>
            </div>
          </div>
        )}
      </div> { /* End inner-content */ }
    </div>
  );
} 