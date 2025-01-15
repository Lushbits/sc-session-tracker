let timer: number | null = null;
let startTime: number = 0;
let totalPaused: number = 0;
let isPaused: boolean = false;
let pauseStartTime: number = 0;

// Helper function to calculate current elapsed time
function getElapsedTime(): number {
  if (!startTime) return 0;
  const now = Date.now();
  return now - startTime - totalPaused;
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'START':
      // Ensure we have a valid start time
      startTime = payload?.startTime || Date.now();
      totalPaused = 0;
      isPaused = false;
      
      // Clear any existing timer
      if (timer) {
        clearInterval(timer);
      }
      
      // Initialize with current elapsed time
      self.postMessage({ type: 'TICK', payload: getElapsedTime() });
      
      // Set up the interval timer
      timer = self.setInterval(() => {
        if (!isPaused) {
          const elapsed = getElapsedTime();
          self.postMessage({ type: 'TICK', payload: elapsed });
        }
      }, 1000);
      break;

    case 'PAUSE':
      if (!isPaused) {
        isPaused = true;
        pauseStartTime = Date.now();
        // Send one last update
        self.postMessage({ type: 'TICK', payload: getElapsedTime() });
      }
      break;

    case 'RESUME':
      if (isPaused) {
        totalPaused += Date.now() - pauseStartTime;
        isPaused = false;
        // Send immediate update after resume
        self.postMessage({ type: 'TICK', payload: getElapsedTime() });
      }
      break;

    case 'STOP':
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      // Send final update
      self.postMessage({ type: 'TICK', payload: getElapsedTime() });
      break;

    case 'RESET':
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      startTime = Date.now();
      totalPaused = 0;
      isPaused = false;
      self.postMessage({ type: 'TICK', payload: 0 });
      break;
  }
}; 