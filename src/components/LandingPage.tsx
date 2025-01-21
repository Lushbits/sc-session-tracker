import { useState } from 'react'
import { LoginForm } from './auth/LoginForm'
import { Footer } from './Footer'
import { Dialog, DialogContent } from './ui/dialog'
import { Heart } from 'lucide-react'
import newSessionView from '../assets/images/new-sessionview.png'
import newUpdateBalance from '../assets/images/new-updatebalance.png'
import newCaptLog from '../assets/images/new-captlog.png'

export function LandingPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <div className="min-h-screen landing-page flex flex-col bg-background">
      <main className="flex-1 flex flex-col items-center justify-center py-16">
        <div className="w-full max-w-6xl space-y-16">
          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold">
                <span>SC Session Tracker</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Maximize Your <a
              href="https://play.sc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Star Citizen
            </a> gaming sessions. Track your earnings, spend, and profits, all while documenting your adventures across the stars in your very own Captain's Log.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-lg text-muted-foreground mb-2">Ready to get started?</p>
              <div className="w-full max-w-md">
                <LoginForm />
              </div>
            </div>
          </div>

          {/* Feature Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            <div className="space-y-4">
              <div 
                className="aspect-[16/10] rounded-lg border bg-card/50 backdrop-blur overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedImage(newSessionView)}
              >
                <img 
                  src={newSessionView} 
                  alt="Session tracking interface" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Real-time Session Tracking</h2>
              <p className="text-muted-foreground">
                Monitor your earnings and expenses in real-time with an intuitive interface. Track your profit per hour and visualize your progress with dynamic charts.
              </p>
            </div>
            <div className="space-y-4">
              <div 
                className="aspect-[16/10] rounded-lg border bg-card/50 backdrop-blur overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedImage(newUpdateBalance)}
              >
                <img 
                  src={newUpdateBalance} 
                  alt="Balance update interface" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Quick Balance Updates</h2>
              <p className="text-muted-foreground">
                Easily record earnings and expenses with a streamlined interface. Categorize your transactions for better tracking and analysis.
              </p>
            </div>
            <div className="space-y-4">
              <div 
                className="aspect-[16/10] rounded-lg border bg-card/50 backdrop-blur overflow-hidden cursor-pointer hover:border-primary transition-colors relative"
                onClick={() => setSelectedImage(newCaptLog)}
              >
                <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded">
                  NEW
                </div>
                <img 
                  src={newCaptLog} 
                  alt="Captain's log interface" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Captain's Log</h2>
              <p className="text-muted-foreground">
                Keep track of your adventures with detailed logs. Add images and notes to remember your most memorable moments in the verse.
              </p>
            </div>
          </div>

          {/* Community Attribution */}
          <div className="text-center text-muted-foreground text-sm px-4">
            Made with <Heart className="inline-block w-4 h-4 mx-1 text-red-500 fill-red-500" /> by the{' '}
            <a
              href="https://play.sc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Star Citizen
            </a>
            {' '}community
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Feature preview" 
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 