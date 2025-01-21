import { supabase } from '../lib/supabase'

interface ImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'origin'
  resize?: 'cover' | 'contain' | 'fill'
}

export function getTransformedImageUrl(path: string, options: ImageOptions = {}) {
  const { width, height, quality = 80, format, resize = 'cover' } = options
  
  return supabase.storage
    .from('log_images')
    .getPublicUrl(path, {
      transform: {
        width,
        height,
        quality,
        format,
        resize
      }
    })
    .data.publicUrl
}

/**
 * Deletes all images associated with a captain's log entry from both storage and database
 * @param logId The ID of the captain's log entry
 * @param userId The ID of the user who owns the log
 * @returns A promise that resolves when all images are deleted
 */
export async function deleteLogImages(logId: string, userId: string) {
  try {
    // 1. Get all images for this log
    const { data: images, error: fetchError } = await supabase
      .from('log_images')
      .select('storage_path')
      .eq('log_id', logId)
      .eq('user_id', userId)

    if (fetchError) throw fetchError

    if (!images || images.length === 0) {
      return { success: true }
    }

    // 2. Delete files from storage bucket
    for (const image of images) {
      const { error: storageError } = await supabase
        .storage
        .from('log_images')
        .remove([image.storage_path])

      if (storageError) throw storageError
    }

    // 3. Delete image records from log_images table
    const { error: deleteError } = await supabase
      .from('log_images')
      .delete()
      .eq('log_id', logId)
      .eq('user_id', userId)

    if (deleteError) throw deleteError

    return { success: true }
  } catch (error) {
    console.error('Error deleting log images:', error)
    throw error
  }
} 