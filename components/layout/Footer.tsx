'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import { cloudinaryLoader } from '@/lib/cloudinary'

interface FooterContent {
  about: string
  quickLinks: {
    title: string
    links: {
      text: string
      url: string
    }[]
  }[]
  customerService: {
    title: string
    links: {
      text: string
      url: string
    }[]
  }[]
  copyright: string
  paymentMethods: string[]
}

export default function Footer() {
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [siteSettings, setSiteSettings] = useState<any>(null)

  useEffect(() => {
    fetchFooterContent()
  }, [])

  const fetchFooterContent = async () => {
    try {
      const response = await fetch('/api/content/footer')
      if (response.ok) {
        const data = await response.json()
        setFooterContent(data.footer)
        setSiteSettings(data.site)
      }
    } catch (error) {
      console.error('Failed to fetch footer content:', error)
      // Use default content if API fails
      setFooterContent({
        about: "We are your trusted partner for quality products and exceptional service. Shop with confidence.",
        quickLinks: [
          {
            title: "Quick Links",
            links: [
              { text: "About Us", url: "/about" },
              { text: "Contact", url: "/contact" },
              { text: "Blog", url: "/blog" },
              { text: "Careers", url: "/careers" }
            ]
          },
          {
            title: "Shop",
            links: [
              { text: "All Products", url: "/products" },
              { text: "Categories", url: "/categories" },
              { text: "Deals", url: "/deals" },
              { text: "New Arrivals", url: "/products?new=true" }
            ]
          }
        ],
        customerService: [
          {
            title: "Customer Service",
            links: [
              { text: "Help Center", url: "/help" },
              { text: "Track Order", url: "/track-order" },
              { text: "Returns", url: "/returns" },
              { text: "Shipping Info", url: "/shipping" }
            ]
          },
          {
            title: "Policies",
            links: [
              { text: "Privacy Policy", url: "/privacy" },
              { text: "Terms of Service", url: "/terms" },
              { text: "Cookie Policy", url: "/cookies" },
              { text: "FAQ", url: "/faq" }
            ]
          }
        ],
        copyright: "© 2024 Premium E-Commerce. All rights reserved.",
        paymentMethods: ["visa", "mastercard", "amex", "paypal"]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  if (isLoading) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Stay Connected</h3>
              <p className="text-gray-400">
                Subscribe to our newsletter for exclusive offers and new product updates.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {siteSettings?.logo ? (
                <Image
                  src={siteSettings.logo}
                  alt={siteSettings.name || 'Company Logo'}
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                  loader={cloudinaryLoader}
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
              )}
              <span className="text-xl font-bold">
                {siteSettings?.name || 'E-Commerce'}
              </span>
            </div>
            
            <p className="text-gray-400 leading-relaxed">
              {footerContent?.about}
            </p>
            
            <div className="flex space-x-4">
              {siteSettings?.socialLinks?.facebook && (
                <Link
                  href={siteSettings.socialLinks.facebook}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
              )}
              {siteSettings?.socialLinks?.twitter && (
                <Link
                  href={siteSettings.socialLinks.twitter}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
              )}
              {siteSettings?.socialLinks?.instagram && (
                <Link
                  href={siteSettings.socialLinks.instagram}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
              )}
              {siteSettings?.socialLinks?.linkedin && (
                <Link
                  href={siteSettings.socialLinks.linkedin}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </Link>
              )}
              {siteSettings?.socialLinks?.youtube && (
                <Link
                  href={siteSettings.socialLinks.youtube}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <Youtube className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Quick Links */}
          {footerContent?.quickLinks?.map((section, index) => (
            <div key={index} className="space-y-4">
              <h4 className="text-lg font-semibold">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.url}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Customer Service */}
          {footerContent?.customerService?.map((section, index) => (
            <div key={index} className="space-y-4">
              <h4 className="text-lg font-semibold">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.url}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Us</h4>
            <div className="space-y-3">
              {siteSettings?.contactEmail && (
                <div className="flex items-center space-x-3 text-gray-400">
                  <Mail className="h-5 w-5" />
                  <span>{siteSettings.contactEmail}</span>
                </div>
              )}
              {siteSettings?.contactPhone && (
                <div className="flex items-center space-x-3 text-gray-400">
                  <Phone className="h-5 w-5" />
                  <span>{siteSettings.contactPhone}</span>
                </div>
              )}
              {siteSettings?.address && (
                <div className="flex items-start space-x-3 text-gray-400">
                  <MapPin className="h-5 w-5 mt-1" />
                  <div>
                    {siteSettings.address.street}<br />
                    {siteSettings.address.city}, {siteSettings.address.state} {siteSettings.address.zipCode}<br />
                    {siteSettings.address.country}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {footerContent && footerContent.paymentMethods && footerContent.paymentMethods.length > 0 && (
        <div className="border-t border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-center space-x-4">
              <span className="text-gray-400 text-sm">We accept:</span>
              <div className="flex space-x-3">
                {footerContent.paymentMethods.map((method, index) => (
                  <div key={index} className="text-gray-400">
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              {footerContent?.copyright?.replace('2024', currentYear.toString()) || 
               `© ${currentYear} Premium E-Commerce. All rights reserved.`}
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/sitemap.xml" className="text-gray-400 hover:text-white text-sm transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}