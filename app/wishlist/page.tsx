import { Metadata } from 'next';
import { WishlistPage } from '@/components/wishlist/WishlistPage';

export const metadata: Metadata = {
  title: 'My Wishlist | Premium E-Commerce',
  description: 'View and manage your favorite products',
};

export default function WishlistRoute() {
  return <WishlistPage />;
}