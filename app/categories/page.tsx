import { Suspense } from 'react'
import CategoriesClient from './CategoriesClient'

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Categories</h1>
        <Suspense fallback={<div>Loading categories...</div>}>
          <CategoriesClient />
        </Suspense>
      </div>
    </div>
  )
}