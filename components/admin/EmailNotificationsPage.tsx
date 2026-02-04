'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Send, 
  Check, 
  X, 
  Clock,
  Filter,
  Search,
  RefreshCw,
  Trash2,
  Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useEmailStore, EmailNotification } from '@/hooks/useEmailNotifications';

export function EmailNotificationsPage() {
  const { 
    notifications, 
    getPendingNotifications, 
    clearNotifications 
  } = useEmailStore();
  
  const [filteredNotifications, setFilteredNotifications] = useState<EmailNotification[]>(notifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<EmailNotification | null>(null);

  useEffect(() => {
    let filtered = notifications;

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, statusFilter, typeFilter]);

  const pendingCount = getPendingNotifications().length;

  const statusConfig = {
    pending: { label: 'Pending', color: 'yellow', icon: Clock },
    sent: { label: 'Sent', color: 'green', icon: Check },
    failed: { label: 'Failed', color: 'red', icon: X },
  };

  const typeConfig = {
    order_placed: { label: 'Order Placed', color: 'blue' },
    order_shipped: { label: 'Order Shipped', color: 'purple' },
    order_delivered: { label: 'Order Delivered', color: 'green' },
    password_reset: { label: 'Password Reset', color: 'orange' },
    welcome: { label: 'Welcome', color: 'pink' },
    promotion: { label: 'Promotion', color: 'indigo' },
  };

  const NotificationCard = ({ notification }: { notification: EmailNotification }) => {
    const statusInfo = statusConfig[notification.status];
    const typeInfo = typeConfig[notification.type];
    const StatusIcon = statusInfo.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setSelectedNotification(notification)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg">{notification.subject}</CardTitle>
                <p className="text-sm text-gray-600">
                  To: {notification.recipient.name} ({notification.recipient.email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-${typeInfo.color}-600 border-${typeInfo.color}-200`}>
                {typeInfo.label}
              </Badge>
              <Badge variant="outline" className={`text-${statusInfo.color}-600 border-${statusInfo.color}-200`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            <p className="text-sm text-gray-700 line-clamp-2">
              {notification.content.substring(0, 150)}...
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Created: {new Date(notification.createdAt).toLocaleDateString()}
              </span>
              {notification.sentAt && (
                <span>
                  Sent: {new Date(notification.sentAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Notifications</h1>
            <p className="text-gray-600">
              Manage and monitor all email communications
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                {pendingCount} pending
              </Badge>
            )}
            
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all notifications?')) {
                  clearNotifications();
                }
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by subject, recipient email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="order_placed">Order Placed</SelectItem>
                <SelectItem value="order_shipped">Order Shipped</SelectItem>
                <SelectItem value="order_delivered">Order Delivered</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.status === 'sent').length}
                </p>
                <p className="text-sm text-gray-600">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.status === 'failed').length}
                </p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="grid gap-6">
          {filteredNotifications.map((notification) => (
            <NotificationCard key={notification._id} notification={notification} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No notifications found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Email notifications will appear here when sent'
              }
            </p>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Email Detail Modal */}
      <Dialog 
        open={!!selectedNotification} 
        onOpenChange={() => setSelectedNotification(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedNotification && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  {selectedNotification.subject}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Email Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Recipient</p>
                    <p className="font-medium">
                      {selectedNotification.recipient.name} ({selectedNotification.recipient.email})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <Badge variant="outline" className={`text-${typeConfig[selectedNotification.type].color}-600`}>
                      {typeConfig[selectedNotification.type].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const statusInfo = statusConfig[selectedNotification.status];
                        const StatusIcon = statusInfo.icon;
                        return (
                          <>
                            <StatusIcon className="h-4 w-4" />
                            <Badge variant="outline" className={`text-${statusInfo.color}-600`}>
                              {statusInfo.label}
                            </Badge>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">
                      {new Date(selectedNotification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedNotification.sentAt && (
                    <div>
                      <p className="text-sm text-gray-600">Sent</p>
                      <p className="font-medium">
                        {new Date(selectedNotification.sentAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Email Content */}
                <div>
                  <h4 className="font-semibold mb-3">Email Content</h4>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {selectedNotification.content}
                    </pre>
                  </div>
                </div>

                {/* Additional Data */}
                {selectedNotification.data && (
                  <div>
                    <h4 className="font-semibold mb-3">Additional Data</h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <pre className="text-xs text-gray-700 overflow-x-auto">
                        {JSON.stringify(selectedNotification.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setSelectedNotification(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}