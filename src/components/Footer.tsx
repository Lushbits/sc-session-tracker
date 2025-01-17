import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

interface VersionHistoryEntry {
  version: string
  date: string
  changes: string[]
}

const versionHistory: VersionHistoryEntry[] = [
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
      'Discord authentication',
      'Dark/light theme support'
    ]
  }
]

export function Footer() {
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const currentVersion = versionHistory[0].version

  return (
    <footer className="mt-auto py-6 border-t border-border">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div>
          Webapp made by{' '}
          <a
            href="https://x.com/Lushbits"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Lushbits
          </a>
        </div>
        
        <div className="text-center">
        Feedback very welcome! It's a beta app and I'm happy to add more features, fix bugs, and improve the experience for you. Feel free to support the project by either sending some sweet, sweet aUEC ingame to{' '}
          <a
            href="https://robertsspaceindustries.com/citizens/Lushbits"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Lushbits
          </a>
          , or use{' '}
          <a
            href="https://robertsspaceindustries.com/enlist?referral=STAR-DSYX-6QYY"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-mono"
          >
            STAR-DSYX-6QYY
          </a>
          {' '}when signing up for a new Star Citizen account.
        </div>

        <button
          onClick={() => setShowVersionHistory(true)}
          className="text-primary hover:underline"
        >
          Version {currentVersion} (Beta)
        </button>
      </div>

      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {versionHistory.map((entry) => (
              <div key={entry.version} className="space-y-2">
                <div className="font-semibold">
                  Version {entry.version}
                  <span className="text-muted-foreground font-normal ml-2">
                    ({entry.date})
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {entry.changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  )
} 