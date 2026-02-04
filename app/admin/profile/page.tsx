import { Metadata } from 'next';
import { AdminProfilePage } from '@/components/admin/AdminProfilePage';

export const metadata: Metadata = {
  title: 'Admin Profile | Premium E-Commerce',
  description: 'Manage your admin profile and account settings',
};

export default function AdminProfileRoute() {
  return <AdminProfilePage />;
}