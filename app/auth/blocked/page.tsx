import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Lock, ArrowLeft } from 'lucide-react'

export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-600">
            Account Blocked
          </CardTitle>
          <CardDescription>
            Your account has been temporarily suspended
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Access Restricted</span>
          </div>
          
          <p className="text-gray-600">
            Your account has been blocked due to violations of our terms of service. 
            Please contact support for more information.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Contact Support:</strong><br />
              Email: support@example.com<br />
              Phone: 1-800-EXAMPLE
            </p>
          </div>
          
          <div className="space-y-3">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>
            
            <Link href="/">
              <Button variant="ghost" className="w-full">
                Continue to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}