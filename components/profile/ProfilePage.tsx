'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  User, 
  Package, 
  MapPin, 
  Settings, 
  Camera,
  Save,
  Edit,
  Plus,
  Trash2,
  Check,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses: Array<{
    _id: string;
    type: 'home' | 'work' | 'other';
    name: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  createdAt: string;
}

interface UpdateProfileData {
  name: string;
  phone?: string;
}

interface AddressData {
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [profileData, setProfileData] = useState<UpdateProfileData>({
    name: '',
    phone: '',
  });

  const [addressData, setAddressData] = useState<AddressData>({
    type: 'home',
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Bangladesh',
    isDefault: false,
  });

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await fetch('/api/users/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json() as Promise<UserProfile>;
    },
    enabled: status === 'authenticated',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Failed to update profile' });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (data: AddressData) => {
      const response = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add address');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsAddingAddress(false);
      resetAddressForm();
      setMessage({ type: 'success', text: 'Address added successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Failed to add address' });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressData }) => {
      const response = await fetch(`/api/users/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update address');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setEditingAddress(null);
      resetAddressForm();
      setMessage({ type: 'success', text: 'Address updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Failed to update address' });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/users/addresses/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete address');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setMessage({ type: 'success', text: 'Address deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Failed to delete address' });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile');
    }
  }, [status, router]);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const resetAddressForm = () => {
    setAddressData({
      type: 'home',
      name: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Bangladesh',
      isDefault: false,
    });
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress, data: addressData });
    } else {
      addAddressMutation.mutate(addressData);
    }
  };

  const handleEditAddress = (address: UserProfile['addresses'][0]) => {
    setAddressData({
      type: address.type,
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditingAddress(address._id);
    setIsAddingAddress(true);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="lg:col-span-3 h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'addresses', label: 'Delivery Addresses', icon: MapPin },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
            <div className="text-center mb-6">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarImage src={profile?.avatar} alt={profile?.name} />
                <AvatarFallback>
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-semibold">{profile?.name}</h2>
              <p className="text-sm text-gray-600">{profile?.email}</p>
            </div>

            <Separator className="mb-4" />

            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Link href="/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-3" />
                  Order History
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Profile Information</h3>
                    <p className="text-sm text-gray-600">Update your personal details</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={updateProfileMutation.isPending}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          value={profile?.email || ''}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Email cannot be changed here. Contact support if needed.
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+880 1XXX XXXXXX"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm text-gray-600">Full Name</Label>
                        <p className="font-medium">{profile?.name || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600">Email Address</Label>
                        <p className="font-medium">{profile?.email}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600">Phone Number</Label>
                        <p className="font-medium">{profile?.phone || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600">Member Since</Label>
                        <p className="font-medium">
                          {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'addresses' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Delivery Addresses</h3>
                      <p className="text-sm text-gray-600">Manage your shipping addresses</p>
                    </div>
                    <Button
                      onClick={() => {
                        setIsAddingAddress(true);
                        setEditingAddress(null);
                        resetAddressForm();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  {isAddingAddress && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6 p-6 bg-gray-50 rounded-lg"
                    >
                      <h4 className="font-semibold mb-4">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h4>
                      
                      <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="addressName">Full Name</Label>
                            <Input
                              id="addressName"
                              value={addressData.name}
                              onChange={(e) => setAddressData(prev => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="addressPhone">Phone Number</Label>
                            <Input
                              id="addressPhone"
                              type="tel"
                              value={addressData.phone}
                              onChange={(e) => setAddressData(prev => ({ ...prev, phone: e.target.value }))}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="addressType">Address Type</Label>
                            <select
                              id="addressType"
                              value={addressData.type}
                              onChange={(e) => setAddressData(prev => ({ ...prev, type: e.target.value as any }))}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="home">Home</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          <div>
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input
                              id="postalCode"
                              value={addressData.postalCode}
                              onChange={(e) => setAddressData(prev => ({ ...prev, postalCode: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="address">Street Address</Label>
                          <Input
                            id="address"
                            value={addressData.address}
                            onChange={(e) => setAddressData(prev => ({ ...prev, address: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={addressData.city}
                              onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={addressData.country}
                              onChange={(e) => setAddressData(prev => ({ ...prev, country: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={addressData.isDefault}
                            onChange={(e) => setAddressData(prev => ({ ...prev, isDefault: e.target.checked }))}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="isDefault">Set as default address</Label>
                        </div>

                        <div className="flex gap-4">
                          <Button
                            type="submit"
                            disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
                          >
                            {addAddressMutation.isPending || updateAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAddingAddress(false);
                              setEditingAddress(null);
                              resetAddressForm();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {profile?.addresses && profile.addresses.length > 0 ? (
                    <div className="space-y-4">
                      {profile.addresses.map((address) => (
                        <motion.div
                          key={address._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{address.name}</h4>
                                <Badge variant={address.type === 'home' ? 'default' : 'secondary'}>
                                  {address.type}
                                </Badge>
                                {address.isDefault && (
                                  <Badge variant="outline" className="text-green-600">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-gray-600 mb-1">{address.address}</p>
                              <p className="text-gray-600 mb-1">
                                {address.city}, {address.postalCode}
                              </p>
                              <p className="text-gray-600 mb-1">{address.country}</p>
                              <p className="text-gray-600">Phone: {address.phone}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAddress(address)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this address?')) {
                                    deleteAddressMutation.mutate(address._id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                                disabled={deleteAddressMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No saved addresses
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Add your first delivery address for faster checkout
                      </p>
                      <Button onClick={() => setIsAddingAddress(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}