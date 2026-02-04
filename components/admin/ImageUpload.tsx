'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

interface ImageUploadProps {
  currentImage?: string
  onImageUpdate: (imageUrl: string) => void
  className?: string
  aspectRatio?: 'square' | 'video' | 'auto'
  maxWidth?: number
  maxHeight?: number
  label?: string
  uploadFolder?: string
}

export default function ImageUpload({ 
  currentImage, 
  onImageUpdate, 
  className = "",
  aspectRatio = 'auto',
  maxWidth = 1920,
  maxHeight = 1080,
  label = "Image",
  uploadFolder = "cms"
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [retryFile, setRetryFile] = useState<File | null>(null)
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
  }, [onImageUpdate])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processImageFile(file)
    }
  }, [onImageUpdate])

  const processImageFile = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
      setPreviewUrl(null)
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error(`Image size must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      setPreviewUrl(null)
      return
    }

    // Additional validation for image dimensions
    const img = new Image()
    img.onload = function() {
      const width = (this as HTMLImageElement).naturalWidth
      const height = (this as HTMLImageElement).naturalHeight
      
      if (aspectRatio === 'square' && Math.abs(width - height) > 50) {
        console.warn(`Square image recommended. Current dimensions: ${width}x${height}`)
      }
      
      if (width > maxWidth || height > maxHeight) {
        console.warn(`Large image detected (${width}x${height}). Image will be automatically compressed.`)
      }
    }
    
    img.onerror = function() {
      toast.error('Invalid or corrupted image file')
      setPreviewUrl(null)
      return
    }
    
    img.src = URL.createObjectURL(file)

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
      formData.append('upload_preset', 'cms_images') // Cloudinary upload preset
      formData.append('folder', uploadFolder)
      formData.append('public_id', `${label.toLowerCase()}_${Date.now()}`)

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
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const result = await response.json()
        
        if (result.secure_url) {
          onImageUpdate(result.secure_url)
          toast.success(`${label} uploaded successfully!`)
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      
      if (errorMessage.includes('413')) {
        toast.error('File too large. Please choose a smaller image.')
      } else if (errorMessage.includes('415')) {
        toast.error('Unsupported file type. Please use JPEG, PNG, GIF, or WebP.')
      } else if (errorMessage.includes('401')) {
        toast.error('You are not authorized to upload images.')
      } else if (errorMessage.includes('429')) {
        toast.error('Too many upload attempts. Please wait and try again.')
      } else {
        toast.error(errorMessage)
      }
      
      setPreviewUrl(null)
      setUploadProgress(0)
      setRetryFile(file) // Store file for retry
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onImageUpdate('')
    setPreviewUrl(null)
    toast.success(`${label} removed`)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square'
      case 'video':
        return 'aspect-video'
      default:
        return 'aspect-auto'
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div className="space-y-3">
        {/* Upload Area */}
        <motion.div
          className={cn(
            "relative border-2 border-dashed rounded-lg overflow-hidden transition-all",
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50',
            isUploading ? 'opacity-50' : 'opacity-100',
            previewUrl || currentImage ? 'border-solid' : 'border-dashed',
            getAspectRatioClasses()
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: isUploading ? 1 : 1.02 }}
          whileTap={{ scale: isUploading ? 1 : 0.98 }}
        >
          {/* Current/Preview Image */}
          <div className={cn(
            "relative w-full h-full overflow-hidden",
            aspectRatio === 'square' && "min-h-[200px]",
            aspectRatio === 'video' && "min-h-[150px]"
          )}>
            {(previewUrl || currentImage) ? (
              <img
                src={previewUrl || currentImage || ''}
                alt={label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">Drag & drop image here</p>
                  <p className="text-xs text-gray-500">or click to browse</p>
                </div>
              </div>
            )}
            
            {/* Upload Overlay */}
            {!isUploading && (
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center cursor-pointer"
                whileHover={{ opacity: 0.8 }}
                onClick={triggerFileInput}
              >
                <div className="text-center text-white">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">
                    {currentImage ? 'Change Image' : 'Upload Image'}
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{Math.round(uploadProgress)}%</p>
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
            {isUploading ? 'Uploading...' : 'Choose Image'}
          </Button>

          {retryFile && !isUploading && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => processImageFile(retryFile)}
              className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <Upload className="h-4 w-4" />
              Retry Upload
            </Button>
          )}

          {(currentImage || previewUrl) && !isUploading && (
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
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Click or drag & drop to upload</p>
          <p>• JPEG, PNG, GIF, WebP • Max 5MB</p>
          {aspectRatio === 'video' && <p>• Recommended: 16:9 aspect ratio</p>}
          {aspectRatio === 'square' && <p>• Recommended: Square image • 400x400px</p>}
        </div>
      </div>

      {/* Drag Active Indicator */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 border-4 border-blue-500 rounded-lg bg-blue-50 bg-opacity-20 pointer-events-none"
        />
      )}
    </div>
  )
}