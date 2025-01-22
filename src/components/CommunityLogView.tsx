export function CommunityLogView() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="relative max-w-2xl w-full">
          {/* Enhanced outer glow effects */}
          <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-[50px]"></div>
          <div className="absolute inset-[2rem] bg-primary/5 blur-[50px] rounded-[30px]"></div>
          
          {/* Content */}
          <div className="relative p-8 rounded-2xl border border-primary/20 bg-black/40 backdrop-blur-sm shadow-[0_0_100px_rgba(var(--primary-rgb)/0.3)] hover:shadow-[0_0_150px_rgba(var(--primary-rgb)/0.4)] transition-all duration-500">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <h2 className="text-2xl font-semibold tracking-tight bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">Community Logs</h2>
              <p className="text-base text-muted-foreground/90 max-w-xl leading-relaxed">
                Here you will be able to view public log entries from your fellow citizens as well as share your own cool space adventures with the world.
              </p>
              <div className="relative">
                <div className="absolute inset-0"></div>
                <p className="relative text-primary font-semibold text-base tracking-wide">Stay tuned, coming soon!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 