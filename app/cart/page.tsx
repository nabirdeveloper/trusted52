import { Metadata } from 'next';
import { CartPage } from '@/components/cart/CartPage';

export const metadata: Metadata = {
  title: 'Shopping Cart | Premium E-Commerce',
  description: 'Review and manage your shopping cart items',
};

export default function CartRoute() {
  return <CartPage />;
}