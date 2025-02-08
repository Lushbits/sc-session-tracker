import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog'
import { ProfileSettings } from './profile-settings'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProfileDialogProps {
  trigger: React.ReactNode
}

export function ProfileDialog({ trigger }: ProfileDialogProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Update your profile information and manage your account settings.
          </DialogDescription>
        </DialogHeader>
        {open && <ProfileSettings onClose={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
} 