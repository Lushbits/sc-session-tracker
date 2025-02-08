import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { ImageCropDialog } from './image-crop-dialog'
import { cn } from '@/lib/utils'
import filter from 'leo-profanity'
import { Area } from 'react-easy-crop'
import { getCroppedImg } from '@/utils/image-crop'

interface ProfileData {
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface ProfileSettingsProps {
  onClose: () => void
}

export function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [isCheckingDisplayName, setIsCheckingDisplayName] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    display_name: null,
    avatar_url: null
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    let mounted = true

    if (!user) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        if (data && mounted) {
          setProfileData(data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to load profile data. Please try again.",
            variant: "destructive"
          })
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      mounted = false
    }
  }, [user, toast])

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setShowCropDialog(true)
    }
  }

  const handleCropComplete = async (croppedAreaPixels: Area) => {
    if (!selectedFile) return
    
    try {
      // Get the cropped image as base64 string
      const croppedImageUrl = await getCroppedImg(
        URL.createObjectURL(selectedFile),
        croppedAreaPixels
      )
      
      // Convert base64 to blob
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      
      // Create a File from the blob
      const file = new File([blob], selectedFile.name || 'profile-picture.jpg', {
        type: 'image/jpeg'
      })
      
      setAvatarFile(file)
      setPreviewUrl(croppedImageUrl)
      setShowCropDialog(false)
    } catch (error) {
      console.error('Error cropping image:', error)
      toast({
        title: "Error",
        description: "Failed to crop image. Please try again.",
        variant: "destructive"
      })
    }
  }

  const checkDisplayNameAvailability = async (name: string): Promise<boolean> => {
    if (!user) return false
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('display_name', name)
        .neq('user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // No data found means the display name is available
        return true
      }

      if (error) throw error

      // If we got data back, the display name is taken
      return !data
    } catch (error) {
      console.error('Error checking display name:', error)
      return false
    }
  }

  const validateDisplayName = async (name: string): Promise<boolean> => {
    if (!name || name.length < 3) {
      setDisplayNameError('Display name must be at least 3 characters long')
      return false
    }
    if (name.length > 20) {
      setDisplayNameError('Display name must be at most 20 characters long')
      return false
    }
    
    // Check for profanity in the entire string and substrings
    const normalizedName = name.toLowerCase()
    const wordList = filter.list()
    const containsProfanity = wordList.some(word => 
      normalizedName.includes(word.toLowerCase())
    )
    
    if (containsProfanity) {
      setDisplayNameError('Please choose an appropriate display name')
      return false
    }

    // Only check availability if the name has changed
    if (name !== profileData.display_name) {
      setIsCheckingDisplayName(true)
      const isAvailable = await checkDisplayNameAvailability(name)
      setIsCheckingDisplayName(false)

      if (!isAvailable) {
        setDisplayNameError('This display name is already taken')
        return false
      }
    }
    
    setDisplayNameError(null)
    return true
  }

  const handleDisplayNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setProfileData(prev => ({ ...prev, display_name: newName }))
    await validateDisplayName(newName)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const displayName = profileData.display_name || ''
    
    if (!await validateDisplayName(displayName)) {
      return
    }

    setSaving(true)

    try {
      let avatar_url = profileData.avatar_url

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            upsert: true
          })

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatar_url = publicUrl

        // Delete old avatar if exists and is different
        if (profileData.avatar_url && profileData.avatar_url !== publicUrl) {
          try {
            const oldPath = new URL(profileData.avatar_url).pathname.split('/').pop()
            if (oldPath) {
              await supabase.storage
                .from('avatars')
                .remove([`${user.id}/${oldPath}`])
            }
          } catch (error) {
            console.error('Error deleting old avatar:', error)
          }
        }
      }

      // Update profile
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        if (updateError.code === '23505') {
          setDisplayNameError('This display name is already taken')
          throw new Error('Display name is already taken')
        }
        throw updateError
      }

      setProfileData(data)
      setPreviewUrl(null)
      setAvatarFile(null)
      updateProfile(data)

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      })

      // Close the dialog after successful update
      onClose()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!user || !profileData.avatar_url) return

    try {
      // Delete the avatar file from storage if it exists
      try {
        const oldPath = new URL(profileData.avatar_url).pathname.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`])
        }
      } catch (error) {
        console.error('Error deleting avatar file:', error)
      }

      // Update profile to remove avatar_url
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      setProfileData(data)
      setPreviewUrl(null)
      setAvatarFile(null)
      updateProfile(data)

      toast({
        title: "Profile Picture Removed",
        description: "Your profile picture has been removed successfully."
      })
    } catch (error: any) {
      console.error('Error removing profile picture:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove profile picture. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <p className="text-muted-foreground">Please log in to access profile settings.</p>
        <Button onClick={() => window.location.href = '/'}>
          Return to Home
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Profile Picture</Label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
            {(previewUrl || profileData.avatar_url) ? (
              <img
                src={previewUrl || profileData.avatar_url || ''}
                alt="Profile picture"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl font-semibold">
                {profileData.display_name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          
          <Label
            htmlFor="avatar-upload"
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Upload Picture
          </Label>
          {(previewUrl || profileData.avatar_url) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDeleteAvatar}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <div className="relative">
          <Input
            id="display_name"
            value={profileData.display_name || ''}
            onChange={handleDisplayNameChange}
            placeholder="Enter your display name"
            maxLength={20}
            className={cn(
              "pr-8",
              displayNameError && "border-[hsl(var(--event-spending))]"
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {profileData.display_name && (
              isCheckingDisplayName ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : displayNameError ? (
                <XCircle className="h-4 w-4 text-[hsl(var(--event-spending))]" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )
            )}
          </div>
        </div>
        {displayNameError ? (
          <p className="text-xs text-[hsl(var(--event-spending))]">
            {displayNameError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Choose a display name between 3-20 characters
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={saving || !!displayNameError || isCheckingDisplayName}
        className="w-full"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>

      {selectedFile && (
        <ImageCropDialog
          open={showCropDialog}
          onClose={() => setShowCropDialog(false)}
          imageUrl={URL.createObjectURL(selectedFile)}
          onCropComplete={handleCropComplete}
        />
      )}
    </form>
  )
} 