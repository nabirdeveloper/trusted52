import { Metadata } from 'next';
import { OrdersPage } from '@/components/profile/OrdersPage';

export const metadata: Metadata = {
  title: 'My Orders | Premium E-Commerce',
  description: 'View your order history and track deliveries',
};

export default function OrdersRoute() {
  return <OrdersPage />;
}