import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, Package, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-gray-400">404</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>
          
          <div className="grid grid-cols-2 gap-3">
            <Link href="/products">
              <Button variant="outline" className="w-full">
                <Package className="w-4 h-4 mr-2" />
                Products
              </Button>
            </Link>
            
            <Link href="/search">
              <Button variant="outline" className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  )
}