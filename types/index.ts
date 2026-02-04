export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
  address?: Address;
  isActive: boolean;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  sku: string;
  barcode?: string;
  trackQuantity: boolean;
  quantity: number;
  images: ProductImage[];
  category: Category;
  subcategory?: Category;
  brand?: string;
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  attributes: ProductAttribute[];
  variants?: ProductVariant[];
  seo: ProductSEO;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  url: string;
  publicId: string;
  alt: string;
  isMain: boolean;
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  filterable: boolean;
}

export interface ProductVariant {
  _id: string;
  name: string;
  price: number;
  sku: string;
  barcode?: string;
  quantity: number;
  image?: string;
  attributes: { [key: string]: string };
}

export interface ProductSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string;
  level: number;
  order: number;
  isActive: boolean;
  seo: CategorySEO;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategorySEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: User;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'cod';
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  total: number;
}

export interface Review {
  _id: string;
  product: string;
  user: User;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface HeroSlide {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  mobileImage?: string;
  ctaText?: string;
  ctaLink?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteSettings {
  _id: string;
  siteName: string;
  siteUrl: string;
  logo: string;
  favicon?: string;
  defaultSeo: DefaultSEO;
  footer: FooterContent;
  contact: ContactInfo;
  social: SocialLinks;
  currency: string;
  taxRate: number;
  shippingCost: number;
  freeShippingThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DefaultSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  twitterCard?: string;
}

export interface FooterContent {
  about?: string;
  columns: FooterColumn[];
  copyright: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterLink {
  label: string;
  url: string;
  external?: boolean;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  address?: Address;
  workingHours?: string;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface Analytics {
  _id: string;
  date: Date;
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: string[];
  topCategories: string[];
  salesByHour: { [hour: string]: number };
  salesByCategory: { [category: string]: number };
}

export interface FilterOptions {
  categories: Category[];
  priceRange: { min: number; max: number };
  brands: string[];
  ratings: number[];
  attributes: { [key: string]: string[] };
}

export interface SearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'rating' | 'popularity';
  page?: number;
  limit?: number;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
  addedAt: Date;
}