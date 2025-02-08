import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Heart, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'

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
  const { toast } = useToast()
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Reset states when dialog is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setFeedback('')
      setIsSubmitting(false)
      setIsSubmitted(false)
      setError(null)
    }
  }, [isOpen])

  const handleClose = () => {
    onOpenChange(false)
    // Add slight delay to ensure dialog closing animation completes
    setTimeout(() => {
      window.location.reload()
    }, 300)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setIsSubmitting(true)
    setError(null)

    // Set a timeout to show an error if submission takes too long
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false)
      setError('Submission timed out. Please try again.')
      toast({
        title: "Submission Timeout",
        description: "The feedback submission is taking too long. Please try again.",
        variant: "destructive"
      })
    }, 10000)

    // Handle iframe load event
    const handleIframeLoad = () => {
      clearTimeout(timeoutId)
      setIsSubmitting(false)
      setIsSubmitted(true)
      toast({
        title: "Feedback Sent",
        description: "Thank you for your feedback!",
      })
    }

    // Add load event listener to iframe
    if (iframeRef.current) {
      iframeRef.current.onload = handleIframeLoad
    }

    // Submit the form
    if (formRef.current) {
      formRef.current.submit()
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Don't allow closing during submission
        if (isSubmitting) return
        if (!open) {
          handleClose()
        } else {
          onOpenChange(true)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Give Feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isSubmitting ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-center">Sending feedback...</p>
            </div>
          ) : isSubmitted ? (
            <div className="space-y-6">
              <div className="py-8 flex flex-col items-center justify-center space-y-4">
                <Heart className="w-12 h-12 text-red-500 animate-pulse" fill="currentColor" />
                <p className="text-lg font-medium text-center">Thanks for your feedback!</p>
              </div>
              <div className="flex justify-center">
                <Button 
                  onClick={handleClose}
                  className="min-w-[100px]"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                Feedback very welcome! It's a beta app and I'm happy to add more features, fix bugs, and improve the experience for you.
              </p>
              
              <form 
                ref={formRef}
                onSubmit={handleSubmit}
                action="https://formsubmit.co/f91f6757a12a6e306ae5ff15b1cd6985"
                method="POST"
                target="hidden_iframe"
                className="space-y-4"
              >
                <input type="hidden" name="_subject" value="SC Session Tracker - FEEDBACK" />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="version" value={version} />
                <input type="hidden" name="buildVersion" value={import.meta.env.VITE_APP_VERSION || 'dev'} />
                <input type="hidden" name="userEmail" value={user?.email || 'Not logged in'} />
                
                <Textarea
                  name="message"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Your feedback..."
                  className="min-h-[150px]"
                />

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={!feedback.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Hidden iframe for form submission */}
        <iframe
          ref={iframeRef}
          name="hidden_iframe"
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  )
} 