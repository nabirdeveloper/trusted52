import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Shield } from 'lucide-react'

export default function AdminRegisterSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">
            Admin Account Created!
          </CardTitle>
          <CardDescription>
            Your admin account has been created successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Admin access granted</span>
          </div>
          
          <p className="text-gray-600">
            Your admin account is now ready. You can access the admin dashboard to manage products, orders, and users.
          </p>
          
          <div className="space-y-3">
            <Link href="/auth/admin-login">
              <Button className="w-full">
                Sign In as Admin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                Continue to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}