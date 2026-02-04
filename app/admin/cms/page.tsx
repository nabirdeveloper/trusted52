'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Image, 
  Type, 
  Palette, 
  Tag, 
  Save,
  Upload,
  Plus,
  X,
  Edit2,
  Trash2,
  GripVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// TODO: Import Switch from your UI library
const Switch = ({ checked, onCheckedChange, ...props }: any) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    }`}
    {...props}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
)
import { Label } from '@/components/ui/label'
import ProfileImageUpload from '@/components/auth/ProfileImageUpload'
import ImageUpload from '@/components/admin/ImageUpload'

export default function CMSManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('hero-slider')
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<any>({})
  const [heroSlides, setHeroSlides] = useState<any[]>([])
  const [featuredCategories, setFeaturedCategories] = useState<any[]>([])
  const [seoSettings, setSeoSettings] = useState<any>({})

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/auth/admin-login')
      return
    }

    fetchCMSData()
  }, [session, status])

  const fetchCMSData = async () => {
    try {
      const [settingsRes, heroRes, categoriesRes, seoRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/content/hero-slider'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/seo')
      ])

      const [settingsData, heroData, categoriesData, seoData] = await Promise.all([
        settingsRes.json(),
        heroRes.json(),
        categoriesRes.json(),
        seoRes.json()
      ])

      setSettings(settingsData.site || {})
      setHeroSlides(heroData || [])
      setFeaturedCategories(categoriesData.categories || [])
      setSeoSettings(seoData.data || {})
    } catch (error) {
      console.error('Failed to fetch CMS data:', error)
    }
  }

  const saveSettings = async (section: string, data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: data })
      })

      if (response.ok) {
        // Update localStorage to refresh navbar immediately
        localStorage.setItem('siteSettings', JSON.stringify(data))
        // Dispatch storage event to update navbar
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'siteSettings',
          newValue: JSON.stringify(data)
        }))
        
        console.log(`${section} settings saved successfully`)
      }
    } catch (error) {
      console.error(`Failed to save ${section}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const addHeroSlide = () => {
    setHeroSlides([...heroSlides, {
      _id: Date.now().toString(),
      title: '',
      subtitle: '',
      image: '',
      buttonText: '',
      buttonLink: '',
      isActive: true,
      position: heroSlides.length
    }])
  }

  const updateHeroSlide = (index: number, field: string, value: any) => {
    const updated = [...heroSlides]
    updated[index][field] = value
    setHeroSlides(updated)
  }

  const removeHeroSlide = (index: number) => {
    setHeroSlides(heroSlides.filter((_, i) => i !== index))
  }

  const moveSlide = (fromIndex: number, toIndex: number) => {
    const newSlides = [...heroSlides]
    const [movedSlide] = newSlides.splice(fromIndex, 1)
    newSlides.splice(toIndex, 0, movedSlide)
    
    // Update positions
    const updatedSlides = newSlides.map((slide, index) => ({
      ...slide,
      position: index
    }))
    
    setHeroSlides(updatedSlides)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (dragIndex !== dropIndex) {
      moveSlide(dragIndex, dropIndex)
    }
  }

  const saveHeroSlides = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/content/hero-slider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: heroSlides })
      })

      if (response.ok) {
        console.log('Hero slides saved successfully')
        // Refresh the data to confirm it was saved
        await fetchCMSData()
      } else {
        console.error('Failed to save hero slides:', response.statusText)
        const errorData = await response.json()
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('Failed to save hero slides:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Settings className="inline-block h-8 w-8 mr-3 text-blue-600" />
            CMS Management
          </h1>
          <p className="text-gray-600">
            Manage your homepage content, SEO, and site settings
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hero-slider">Hero Slider</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="site-settings">Site Settings</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          {/* Hero Slider Management */}
          <TabsContent value="hero-slider" className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Hero Slider Content</CardTitle>
                  <Button onClick={addHeroSlide} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Slide
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {heroSlides.map((slide, index) => (
                    <div 
                      key={slide._id} 
                      className="border rounded-lg p-6 space-y-4 bg-white hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="cursor-move p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`slide-title-${index}`}>Slide Title</Label>
                                <Input
                                  id={`slide-title-${index}`}
                                  value={slide.title}
                                  onChange={(e) => updateHeroSlide(index, 'title', e.target.value)}
                                  placeholder="Enter slide title"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`slide-subtitle-${index}`}>Subtitle</Label>
                                <Textarea
                                  id={`slide-subtitle-${index}`}
                                  value={slide.subtitle}
                                  onChange={(e) => updateHeroSlide(index, 'subtitle', e.target.value)}
                                  placeholder="Enter slide subtitle"
                                  rows={2}
                                />
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`slide-button-${index}`}>Button Text</Label>
                                <Input
                                  id={`slide-button-${index}`}
                                  value={slide.buttonText}
                                  onChange={(e) => updateHeroSlide(index, 'buttonText', e.target.value)}
                                  placeholder="Shop Now"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`slide-link-${index}`}>Button Link</Label>
                                <Input
                                  id={`slide-link-${index}`}
                                  value={slide.buttonLink}
                                  onChange={(e) => updateHeroSlide(index, 'buttonLink', e.target.value)}
                                  placeholder="/products"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={slide.isActive}
                              onCheckedChange={(checked: boolean) => updateHeroSlide(index, 'isActive', checked)}
                            />
                            <Label>Active</Label>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeHeroSlide(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Background Image</Label>
                        <ImageUpload
                          currentImage={slide.image}
                          onImageUpdate={(imageUrl) => updateHeroSlide(index, 'image', imageUrl)}
                          aspectRatio="video"
                          label="Hero Slide"
                          uploadFolder="hero-slider"
                          className="max-w-md"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={saveHeroSlides} 
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Hero Slider'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Management */}
          <TabsContent value="categories" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Featured Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featuredCategories && featuredCategories.length > 0 ? (
                    featuredCategories.map((category) => (
                      <div key={category._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                                <Tag className="h-6 w-6 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant={category.isActive ? 'default' : 'secondary'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No categories found. Add some categories to see them here.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Site Settings */}
          <TabsContent value="site-settings" className="mt-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input
                      id="site-name"
                      value={settings.name || ''}
                      onChange={(e) => setSettings({...settings, name: e.target.value})}
                      placeholder="Your Store Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="site-description">Site Description</Label>
                    <Textarea
                      id="site-description"
                      value={settings.description || ''}
                      onChange={(e) => setSettings({...settings, description: e.target.value})}
                      placeholder="Your store description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={settings.contactEmail || ''}
                      onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                      placeholder="info@example.com"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Site Logo</Label>
                    <div className="space-y-3">
                      {settings.logo && (
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm">
                          <img
                            src={settings.logo}
                            alt="Site logo preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <ImageUpload
                        currentImage={settings.logo}
                        onImageUpdate={(imageUrl) => setSettings({...settings, logo: imageUrl})}
                        aspectRatio="square"
                        label="Site Logo"
                        uploadFolder="site-logo"
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <Switch
                      id="maintenance-mode"
                      checked={settings.maintenanceMode || false}
                      onCheckedChange={(checked: boolean) => setSettings({...settings, maintenanceMode: checked})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => saveSettings('site', settings)}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>SEO Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Type className="h-5 w-5 text-blue-600" />
                      Meta Tags
                    </h3>
                    
                    <div>
                      <Label htmlFor="meta-title-default">Default Title</Label>
                      <Input
                        id="meta-title-default"
                        value={seoSettings.defaultTitle || ''}
                        onChange={(e) => setSeoSettings({...seoSettings, defaultTitle: e.target.value})}
                        placeholder="Your Store - Shop Online"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="meta-description-default">Default Description</Label>
                      <Textarea
                        id="meta-description-default"
                        value={seoSettings.defaultDescription || ''}
                        onChange={(e) => setSeoSettings({...seoSettings, defaultDescription: e.target.value})}
                        placeholder="Best online shopping experience"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="meta-keywords">Default Keywords</Label>
                      <Input
                        id="meta-keywords"
                        value={seoSettings.defaultKeywords || ''}
                        onChange={(e) => setSeoSettings({...seoSettings, defaultKeywords: e.target.value})}
                        placeholder="shopping, ecommerce, online store"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-600" />
                      OpenGraph
                    </h3>
                    
                    <div>
                      <Label htmlFor="og-site-name">OG Site Name</Label>
                      <Input
                        id="og-site-name"
                        value={seoSettings.ogSiteName || ''}
                        onChange={(e) => setSeoSettings({...seoSettings, ogSiteName: e.target.value})}
                        placeholder="Your Store"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="og-image-default">Default OG Image</Label>
                      <div className="space-y-2">
                        {seoSettings.defaultOgImage && (
                          <div className="w-32 h-20 rounded-lg overflow-hidden border">
                            <img
                              src={seoSettings.defaultOgImage}
                              alt="OG preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <Input
                          id="og-image-default"
                          value={seoSettings.defaultOgImage || ''}
                          onChange={(e) => setSeoSettings({...seoSettings, defaultOgImage: e.target.value})}
                          placeholder="https://example.com/og-image.jpg"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="generate-sitemap">Auto-Generate Sitemap</Label>
                      <Switch
                        id="generate-sitemap"
                        checked={seoSettings.generateSitemap || false}
                        onCheckedChange={(checked: boolean) => setSeoSettings({...seoSettings, generateSitemap: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={() => saveSettings('seo', seoSettings)}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save SEO Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}