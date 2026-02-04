'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
// Toast utility - implement your preferred toast system
const toast = {
  success: (message: string) => {
    console.log('SUCCESS:', message)
    // TODO: Implement your preferred toast notification
  },
  error: (message: string) => {
    console.error('ERROR:', message)
    // TODO: Implement your preferred toast notification
  }
}

interface ProfileImageUploadProps {
  currentImage?: string
  onImageUpdate: (imageUrl: string) => void
  userId: string
  className?: string
}

export default function ProfileImageUpload({ 
  currentImage, 
  onImageUpdate, 
  userId,
  className = ""
}: ProfileImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (file) {
      await processImageFile(file)
    }
  }, [userId, onImageUpdate])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processImageFile(file)
    }
  }, [userId, onImageUpdate])

  const processImageFile = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary
    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create form data for Cloudinary upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'profile_images') // Cloudinary upload preset
      formData.append('folder', `users/${userId}/profile`)
      formData.append('public_id', `${userId}_profile_${Date.now()}`)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 10
        })
      }, 200)

      // Upload to Cloudinary
      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          onImageUpdate(result.secure_url)
          toast.success('Profile image updated successfully!')
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image. Please try again.')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleRemoveImage = async () => {
    try {
      const response = await fetch('/api/user/profile-image', {
        method: 'DELETE'
      })

      if (response.ok) {
        onImageUpdate('')
        setPreviewUrl(null)
        toast.success('Profile image removed')
      }
    } catch (error) {
      toast.error('Failed to remove image')
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Upload Area */}
        <motion.div
          className={`
            relative w-32 h-32 rounded-full border-2 border-dashed transition-all
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
            ${isUploading ? 'opacity-50' : 'opacity-100'}
            ${previewUrl || currentImage ? 'border-solid' : 'border-dashed'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Current/Preview Image */}
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <img
              src={previewUrl || currentImage || ''}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            
            {/* Upload Overlay */}
            {!isUploading && (
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-full cursor-pointer"
                whileHover={{ opacity: 0.6 }}
                onClick={triggerFileInput}
              >
                <Camera className="h-6 w-6 text-white" />
              </motion.div>
            )}
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-full">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto mb-2" />
                  <div className="w-20 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
                  <p className="text-xs text-gray-600 mt-1">{Math.round(uploadProgress)}%</p>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </motion.div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Change Photo'}
          </Button>

          {currentImage && !isUploading && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRemoveImage}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600 space-y-1">
          <p>Click or drag & drop to upload</p>
          <p>JPEG, PNG, GIF, WebP • Max 5MB</p>
          <p>Recommended: Square image • 400x400px</p>
        </div>
      </div>

      {/* Drag Active Indicator */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 border-4 border-blue-500 rounded-full bg-blue-50 bg-opacity-20"
        />
      )}
    </div>
  )
}