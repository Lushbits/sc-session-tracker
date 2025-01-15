import { useEffect, useState, useCallback } from 'react';

export function useTimer(startTime: Date, isEnded: boolean = false) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);

  // Initialize worker
  useEffect(() => {
    const timerWorker = new Worker(new URL('../workers/timer.worker.ts', import.meta.url));
    
    timerWorker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'TICK') {
        setElapsedTime(e.data.payload);
      }
    };

    setWorker(timerWorker);
    
    // Pass the session start time to the worker
    timerWorker.postMessage({ 
      type: 'START',
      payload: { startTime: startTime.getTime() }
    });

    return () => {
      timerWorker.postMessage({ type: 'STOP' });
      timerWorker.terminate();
    };
  }, [startTime]);

  // Handle session end
  useEffect(() => {
    if (isEnded && worker) {
      worker.postMessage({ type: 'STOP' });
    }
  }, [isEnded, worker]);

  const pause = useCallback(() => {
    if (worker) {
      worker.postMessage({ type: 'PAUSE' });
      setIsPaused(true);
    }
  }, [worker]);

  const resume = useCallback(() => {
    if (worker) {
      worker.postMessage({ type: 'RESUME' });
      setIsPaused(false);
    }
  }, [worker]);

  // Format elapsed time in HH:MM:SS format
  const formatElapsedTime = useCallback((ms: number): string => {
    if (ms === 0) return "00:00:00";
    
    // Ensure we're working with positive numbers
    ms = Math.abs(ms);
    
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    // Format with leading zeros
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }, []);

  return {
    elapsedTime,
    isPaused,
    pause,
    resume,
    formattedTime: formatElapsedTime(elapsedTime)
  };
} 