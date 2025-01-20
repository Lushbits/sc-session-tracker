import { useState } from 'react'
import { VersionHistoryDialog, versionHistory } from './VersionHistory'

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
        
        <div className="text-center w-1/2 pl-12 pr-12">
          Feel free to support the project by either sending some sweet, sweet aUEC ingame to{' '}
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

        <VersionHistoryDialog 
          open={showVersionHistory} 
          onOpenChange={setShowVersionHistory} 
        />
      </div>
    </footer>
  )
} 