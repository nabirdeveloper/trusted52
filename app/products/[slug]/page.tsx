import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/connect'
import Product from '@/lib/models/Product'
import Review from '@/lib/models/Review'
import ProductDetailClient from './ProductDetailClient'
import { Toaster } from 'react-hot-toast'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    await connectDB()
    
    const product = await Product.findOne({ 
      slug, 
      status: 'active' 
    }).lean()

    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The product you are looking for could not be found.'
      }
    }

    const title = product.seo?.title || product.name
    const description = product.seo?.description || product.shortDescription || product.description?.substring(0, 160)
    const keywords = product.seo?.keywords || []
    
    const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0]

    return {
      title,
      description,
      keywords: keywords.join(', '),
      openGraph: {
        title,
        description,
        images: primaryImage ? [{
          url: primaryImage.url,
          alt: primaryImage.alt || product.name,
          width: 1200,
          height: 630
        }] : [],
        type: 'website',
        siteName: 'Premium E-Commerce Store'
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: primaryImage ? [primaryImage.url] : []
      },
      alternates: {
        canonical: `/products/${slug}`
      },
      robots: {
        index: true,
        follow: true
      },
      other: {
        'product:price:amount': product.price.toString(),
        'product:price:currency': 'USD',
        'product:availability': product.quantity > 0 ? 'in stock' : 'out of stock',
        'product:brand': 'Premium Store',
        'product:condition': 'new'
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Product',
      description: 'Product details'
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const { slug } = await params
    const session = await getServerSession(authOptions)
    
    await connectDB()

    // Find the product by slug and populate related data
    const product = await Product.findOne({ 
      slug, 
      status: 'active' 
    })
      .populate('categories', 'name slug image')
      .lean()
      .then(doc => doc ? JSON.parse(JSON.stringify(doc)) : null)

    if (!product) {
      console.error('Product not found for slug:', slug)
      notFound()
    }

    // Get related products from same categories
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      categories: { $in: product.categories },
      status: 'active'
    })
    .populate('categories', 'name slug')
    .limit(8)
    .lean()
    .then(docs => docs.map(doc => JSON.parse(JSON.stringify(doc))))

    // Get reviews for this product
    const reviews = await Review.find({ 
      productId: product._id,
      isApproved: true 
    })
    .populate('userId', 'name image')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()
    .then(docs => docs.map(doc => JSON.parse(JSON.stringify(doc))))

    // Check if user has purchased this product
    let userPurchased = false
    if (session) {
      // TODO: Check user's order history for this product
      userPurchased = false // Placeholder
    }

    return (
      <>
        <ProductDetailClient 
          product={product}
          relatedProducts={relatedProducts}
          reviews={reviews}
          userPurchased={userPurchased}
          session={session}
        />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </>
    )
  } catch (error) {
    console.error('Error loading product:', error)
    notFound()
  }
}