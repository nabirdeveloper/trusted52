import { Metadata } from 'next';
import { EmailNotificationsPage } from '@/components/admin/EmailNotificationsPage';

export const metadata: Metadata = {
  title: 'Email Notifications | Admin Dashboard',
  description: 'Manage email notifications and templates',
};

export default function EmailNotificationsRoute() {
  return <EmailNotificationsPage />;
}