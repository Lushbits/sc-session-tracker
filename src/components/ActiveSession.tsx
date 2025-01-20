import React from 'react';
import { Button } from '@/components/ui/button';

interface ActiveSessionProps {
  onUpdateBalance: () => void
  onViewLogs: () => void
  logCount: number
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ onUpdateBalance, onViewLogs, logCount }) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onUpdateBalance}
        className="h-8 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 hover:shadow-[0_0_15px_hsla(var(--primary)/0.2)] transition-all"
      >
        Update Balance
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onViewLogs}
        className="h-8 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 hover:shadow-[0_0_15px_hsla(var(--primary)/0.2)] transition-all flex items-center"
      >
        Session log
        {logCount > 0 && (
          <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
            {logCount}
          </span>
        )}
      </Button>
    </div>
  );
};

export default ActiveSession; 