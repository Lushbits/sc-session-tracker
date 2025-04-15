import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Dialog, DialogContent } from './ui/dialog'
import { Footer } from './Footer'
import { LoginForm } from './auth/LoginForm'
import newSessionView from '../assets/images/new-sessionview.png'
import newUpdateBalance from '../assets/images/new-updatebalance.png'
import comLogs from '../assets/images/comlogs.png'
import './starry-bg.css'

export function LandingPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [stars, setStars] = useState<{ x: number; y: number; size: number; delay: number; duration: number }[]>([])

  useEffect(() => {
    // Generate random stars
    const generateStars = () => {
      const newStars = []
      const starCount = 150 // Number of stars
      
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          x: Math.random() * 100, // Random x position (0-100%)
          y: Math.random() * 100, // Random y position (0-100%)
          size: 0.5 + Math.random() * 1.5, // Random size (0.5-2px)
          delay: Math.random() * 10, // Random delay (0-10s)
          duration: 3 + Math.random() * 4 // Random duration (3-7s)
        })
      }
      
      setStars(newStars)
    }
    
    generateStars()
  }, [])

  return (
    <div className="min-h-screen bg-background landing-page flex flex-col relative overflow-hidden">
      {/* Starry background */}
      <div className="starry-bg absolute inset-0 pointer-events-none">
        {stars.map((star, index) => (
          <div
            key={index}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`
            }}
          />
        ))}
      </div>
      
      <main className="flex-1 flex flex-col items-center justify-center py-16 relative z-10">
        <div className="w-full max-w-6xl space-y-16">
          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4">
            <div className="space-y-6 relative">
              <div className="absolute -top-8 -left-4 transform -rotate-6 animate-pulse">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap border border-white/10">
                  ver 0.5 just launched with community logs!
                </div>
              </div>
              <h1 className="text-4xl font-bold">
                SC Session Tracker
              </h1>
              <p className="text-xl text-muted-foreground">
                Maximize Your <a
                  href="https://robertsspaceindustries.com/play-star-citizen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Star Citizen
                </a> gaming sessions. Track your earnings, spend, and profits, all while documenting your adventures across the stars. Share your most memorable experiences with the community through our new Community Logs system!
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-sm">
                <p className="text-lg text-muted-foreground mb-4 text-center">Ready to get started?</p>
                <LoginForm />
              </div>
            </div>
          </div>

          {/* Feature Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            <div className="space-y-4">
              <div 
                className="aspect-[16/10] rounded-lg border bg-card backdrop-blur-md overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
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
                className="aspect-[16/10] rounded-lg border bg-card backdrop-blur-md overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
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
                className="aspect-[16/10] rounded-lg border bg-card backdrop-blur-md overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] relative"
                onClick={() => setSelectedImage(comLogs)}
              >
                <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                  HOT NEW FEATURE
                </div>
                <img 
                  src={comLogs} 
                  alt="Community logs interface" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Community Logs</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Just Launched!</span>
              </div>
              <p className="text-muted-foreground">
                Share your most epic adventures with the Star Citizen community! Publish logs and upvote memorable stories. Connect with fellow pilots through shareable logs with images and detailed stories.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-secondary/60 px-2 py-1 rounded-full">Upvote logs</span>
                <span className="bg-secondary/60 px-2 py-1 rounded-full">Share with friends</span>
                <span className="bg-secondary/60 px-2 py-1 rounded-full">Discover adventures</span>
              </div>
            </div>
          </div>

          {/* Community Attribution */}
          <div className="text-center text-muted-foreground text-sm px-4">
            Made with <Heart className="inline-block w-4 h-4 mx-1 text-red-500 fill-red-500" /> by the{' '}
            <a
              href="https://robertsspaceindustries.com/en/star-citizen"
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