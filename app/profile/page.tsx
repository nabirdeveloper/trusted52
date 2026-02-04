import { Metadata } from 'next';
import { ProfilePage } from '@/components/profile/ProfilePage';

export const metadata: Metadata = {
  title: 'My Account | Premium E-Commerce',
  description: 'Manage your account information and view order history',
};

export default function ProfileRoute() {
  return <ProfilePage />;
}