import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

export interface VersionHistoryEntry {
  version: string
  date: string
  changes: string[]
}

export const versionHistory: VersionHistoryEntry[] = [
  {
    version: '0.3.6',
    date: '2025-01-26',
    changes: [
      'Improved URL handling and navigation behavior across the application',
      'Fixed "Active Session" indicator behavior in main menu',
      'Updated application favicon with custom icon',
      'Refactored session list view for better maintainability and performance'
    ]
  },
  {
    version: '0.3.5',
    date: '2025-01-22',
    changes: [
      'Added the ability to favorite Captain\'s Logs and view only favorites',
    ]
  },
  {
    version: '0.3.4',
    date: '2025-01-21',
    changes: [
      'Improved image quality in Captain\'s Log with Supabase image transformations',
      'Enhanced image display with proper aspect ratio and optimized loading',
      'Added "Open original in new tab" feature for full-size image viewing',
      'Reorganized image preview in the log entry form for better UX',
      'Added additional default spend and earnings categories'
    ]
  },
  {
    version: '0.3.3',
    date: '2025-01-20',
    changes: [
      'Bugfix: Make sure we properly account for balance events in the total earnings and spending calculations.',
      'Bugfix: Make sure a new session starts with 0 if the last session ended 0 (use nullish coalescing operator instead of logical OR)'
  ]
  },
  {
    version: '0.3.2',
    date: '2025-01-20',
    changes: [
      'Bugfix: Implement consistent number formatting for balance and other numeric values regardless of locale or user settings',
    ]
  },
  {
    version: '0.3.1',
    date: '2025-01-20',
    changes: [
      'Make sure log images are deleted from database storage when a log is deleted',
      'Updated version history dialog to be more readable and scrollable'
    ]
  },
  {
    version: '0.3.0',
    date: '2025-01-20',
    changes: [
      'Added Captain\'s Log feature for documenting session experiences with image support',
      'Redesigned landing page with feature showcase and interactive image previews',
      'Added Community Logs section (coming soon)',
      'Improved session details view with better scrolling and animations',
      'Improved session details view with better scrolling and animations',
      'Enhanced date and time display across the application',
      'Added visual feedback for interactive elements',
      'Improved UI consistency and animations throughout the app',
      'Fixed various bugs and improved performance'
    ]
  },
  {
    version: '0.2.5',
    date: '2025-01-17',
    changes: [
      'Added feedback form with email integration',
      'Enhanced button hover effects and animations',
      'Improved UI consistency across the app',
      'Updated dialog box and chart background colors'
    ]
  },
  {
    version: '0.2.0',
    date: '2025-01-16',
    changes: [
      'Improved landing page with feature showcase and screenshots',
      'Added session logs feature for tracking session details',
      'Simplified authentication to Discord-only login',
      'Enhanced UI with gradient backgrounds and improved spacing',
      'Added automatic balance carry-forward from previous sessions',
      'Fixed double event creation in balance updates'
    ]
  },
  {
    version: '0.1.0',
    date: '2025-01-15',
    changes: [
      'Initial beta release',
      'Basic session tracking functionality',
      'Discord authentication'
    ]
  }
]

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VersionHistoryDialog({ open, onOpenChange }: VersionHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col max-w-[750px]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-secondary/20 hover:scrollbar-thumb-secondary/80 pr-6">
          <div className="space-y-6">
            {versionHistory.map((entry) => (
              <div key={entry.version} className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-semibold">Version {entry.version}</h3>
                  <span className="text-sm text-muted-foreground">({entry.date})</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {entry.changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 