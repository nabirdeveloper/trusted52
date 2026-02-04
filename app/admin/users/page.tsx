import { Metadata } from 'next'
import UserManagement from '@/components/admin/UserManagement'

export const metadata: Metadata = {
  title: 'User Management - Admin Dashboard',
  description: 'Manage users, roles, and permissions'
}

export default function UserManagementPage() {
  return <UserManagement />
}