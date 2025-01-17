import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Heart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface FeedbackDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  version: string
}

export function FeedbackDialog({
  isOpen,
  onOpenChange,
  version
}: FeedbackDialogProps) {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check for success parameter in URL when component mounts or URL changes
  useEffect(() => {
    console.log('URL Check:', {
      search: window.location.search,
      hash: window.location.hash,
      pathname: window.location.pathname
    })
    
    // Check both query params and hash fragment
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    
    console.log('Params Check:', {
      urlParams: urlParams.get('feedback'),
      hashParams: hashParams.get('feedback')
    })
    
    if (urlParams.get('feedback') === 'success' || hashParams.get('feedback') === 'success') {
      console.log('Success state detected!')
      setIsSubmitted(true)
      setFeedback('')
      // Make sure dialog is open
      onOpenChange(true)
      // Remove the success parameter from URL without page refresh
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false)
        onOpenChange(false)
        setIsSubmitting(false)
      }, 3000)
    }
  }, [onOpenChange, window.location.search, window.location.hash])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setIsSubmitting(true)
    // Get the form element and submit
    e.currentTarget.submit()
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Don't allow closing during submission or success state
        if (isSubmitting || isSubmitted) return
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Give Feedback</DialogTitle>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <Heart className="w-12 h-12 text-red-500 animate-pulse" fill="currentColor" />
            <p className="text-lg font-medium text-center">Thanks for your feedback!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Feedback very welcome! It's a beta app and I'm happy to add more features, fix bugs, and improve the experience for you.
            </p>
            
            <form 
              onSubmit={handleSubmit}
              action="https://formsubmit.co/f91f6757a12a6e306ae5ff15b1cd6985"
              method="POST"
              className="space-y-4"
            >
              <input type="hidden" name="_subject" value="SC Session Tracker - FEEDBACK" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_next" value={`${window.location.origin}${window.location.pathname}?feedback=success`} />
              <input type="hidden" name="version" value={version} />
              <input type="hidden" name="buildVersion" value={import.meta.env.VITE_APP_VERSION || 'dev'} />
              <input type="hidden" name="userEmail" value={user?.email || 'Not logged in'} />
              
              <Textarea
                name="message"
                value={feedback}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
                placeholder="Your feedback..."
                className="min-h-[150px]"
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!feedback.trim() || isSubmitting}
                  variant="default"
                >
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 